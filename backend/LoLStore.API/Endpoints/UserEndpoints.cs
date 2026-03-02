using System.IdentityModel.Tokens.Jwt;
using System.Net;
using LoLStore.API.Filter;
using LoLStore.API.Identities;
using LoLStore.API.Models;
using LoLStore.API.Models.OrderModel;
using LoLStore.API.Models.UserModel;
using LoLStore.Core.DTO.Users;
using LoLStore.Core.Entities;
using LoLStore.Core.Queries;
using LoLStore.Services.Shop.Users;
using Mapster;
using MapsterMapper;
using Microsoft.AspNetCore.Mvc;

namespace LoLStore.API.Endpoints;

public static class UserEndpoints
{
    public static WebApplication MapAccountEndpoints(this WebApplication app)
    {
        var builder = app.MapGroup("/api/account");

        #region GET

        builder.MapGet("/refreshToken", RefreshToken)
            .AllowAnonymous()
            .Produces<ApiResponse<AccessTokenModel>>();

        builder.MapGet("/logout", Logout)
            .AllowAnonymous();

        builder.MapGet("/{userId:guid}", GetUserById)
            .RequireAuthorization("RequireAdminRole")
            .Produces<ApiResponse<UserDto>>();

        builder.MapGet("/getUsers", GetUsers)
            .RequireAuthorization("RequireAdminRole")
            .Produces<ApiResponse<PaginationResult<UserAdminDto>>>();

        builder.MapGet("/roles", GetRoles)
            .RequireAuthorization("RequireAdminRole")
            .Produces<ApiResponse<IList<RoleDto>>>();

        builder.MapGet("/users/{userId:guid}/orders", GetOrdersByUser)
            .RequireAuthorization()
            .Produces<ApiResponse<PaginationResult<OrderDto>>>();

        builder.MapGet("/users/{userId:guid}/orders/recent", GetRecentOrdersByUser)
            .RequireAuthorization()
            .Produces<ApiResponse<List<OrderDto>>>();
        #endregion

        #region POST

        builder.MapPost("/login", Login)
            .AllowAnonymous()
            .Produces<ApiResponse<AccessTokenModel>>();

        builder.MapPost("/register", Register)
            .AddEndpointFilter<ValidatorFilter<RegisterModel>>()
            .Produces<ApiResponse<UserDto>>();

        #endregion

        #region PUT

        builder.MapPut("/updateUser", UpdateUser)
            .AddEndpointFilter<ValidatorFilter<UserEditModel>>()
            .Produces<ApiResponse<UserDto>>();

        builder.MapPut("/changePassword", ChangePassword)
            .AddEndpointFilter<ValidatorFilter<PasswordEditModel>>()
            .Produces<ApiResponse<string>>();

        builder.MapPut("/users/{userId:guid}/resetPassword", ResetPassword)
            .RequireAuthorization("RequireAdminRole")
            .AddEndpointFilter<ValidatorFilter<PasswordResetModel>>()
            .Produces<ApiResponse<string>>();

        builder.MapPut("/updateUserRoles", UpdateUserRoles)
            .RequireAuthorization("RequireAdminRole")
            .Produces<ApiResponse<UserDto>>();

        builder.MapPut("/ban", BanUser)
            .RequireAuthorization("RequireAdminRole")
            .Produces<ApiResponse<string>>();

        builder.MapPut("/unban/{id:guid}", UnbanUser)
            .RequireAuthorization("RequireAdminRole")
            .Produces<ApiResponse<string>>();

        #endregion

        #region DELETE

        builder.MapDelete("/toggleDelete/{id:guid}", ToggleDeleteUser)
            .RequireAuthorization("RequireAdminRole");

        #endregion

        return app;
    }

    #region GET METHODS

    private static async Task<IResult> GetUserById(
        [FromRoute] Guid userId,
        [FromServices] IUserRepository repository,
        [FromServices] IMapper mapper,
        CancellationToken ct)
    {
        var user = await repository.GetUserByIdAsync(userId, getFull: true, ct);
        if (user == null)
            return Results.NotFound(ApiResponse.Fail(HttpStatusCode.NotFound, "User not found."));

        return Results.Ok(ApiResponse.Success(mapper.Map<UserDto>(user)));
    }

    private static async Task<IResult> GetUsers(
        [AsParameters] UserManagerFilterModel model,
        [FromServices] IUserRepository repository,
        [FromServices] IMapper mapper,
        CancellationToken ct)
    {
        var query = mapper.Map<UserQuery>(model);

        var users = await repository.GetPagedUsersAsync(
            query,
            model,
            p => p.ProjectToType<UserAdminDto>(),
            ct);

        return Results.Ok(ApiResponse.Success(new PaginationResult<UserAdminDto>(users)));
    }

    private static async Task<IResult> GetRoles(
        [FromServices] IUserRepository repository,
        [FromServices] IMapper mapper,
        CancellationToken ct)
    {
        var roles = await repository.GetRolesAsync(ct);
        return Results.Ok(ApiResponse.Success(mapper.Map<IList<RoleDto>>(roles)));
    }

    private static async Task<IResult> GetOrdersByUser(
        [FromRoute] Guid userId,
        [AsParameters] PagingModel pagingParams,
        [FromServices] IUserRepository repository,
        [FromServices] IMapper mapper,
        CancellationToken ct)
    {
        var user = await repository.GetUserByIdAsync(userId, false, ct);
        if (user == null)
            return Results.NotFound(ApiResponse.Fail(HttpStatusCode.NotFound, "User not found."));

        var orders = await repository.GetPagedOrdersByUserAsync(
            userId,
            pagingParams,
            p => p.ProjectToType<OrderDto>(),
            ct);

        return Results.Ok(ApiResponse.Success(new PaginationResult<OrderDto>(orders)));
    }

    private static async Task<IResult> RefreshToken(
        HttpContext context,
        [FromServices] IUserRepository repository,
        [FromServices] IMapper mapper,
        [FromServices] IConfiguration configuration,
        CancellationToken ct)
    {
        var refreshTokenString = context.Request.Cookies["refreshToken"];
        if (string.IsNullOrWhiteSpace(refreshTokenString))
            return Results.Ok(ApiResponse.Fail(HttpStatusCode.Unauthorized, "Refresh token cookie is missing."));

        var tokenEntity = await repository.GetRefreshTokenAsync(refreshTokenString, ct);
        if (tokenEntity == null)
            return Results.Ok(ApiResponse.Fail(HttpStatusCode.Unauthorized, "Invalid refresh token."));

        // Reuse attack: token exists but already revoked
        if (tokenEntity.IsRevoked)
        {
            await repository.RevokeAllUserRefreshTokensAsync(
                tokenEntity.UserId,
                "Reuse attack detected — revoked token was presented again",
                ct);
            context.RemoveRefreshTokenCookie();
            return Results.Ok(ApiResponse.Fail(HttpStatusCode.Unauthorized,
                "Token reuse detected. All sessions have been invalidated. Please login again."));
        }

        // Normal expiry
        if (tokenEntity.IsExpired)
        {
            context.RemoveRefreshTokenCookie();
            return Results.Ok(ApiResponse.Fail(HttpStatusCode.Unauthorized,
                "Refresh token expired. Please login again."));
        }

        var user = await repository.GetUserByIdAsync(tokenEntity.UserId, getFull: true, ct);
        if (user == null)
        {
            context.RemoveRefreshTokenCookie();
            return Results.Ok(ApiResponse.Fail(HttpStatusCode.Unauthorized, "Associated user not found."));
        }

        var userDto = mapper.Map<UserDto>(user);
        var jwt = userDto.GenerateJwt(configuration);

        // Rotate: generate new, revoke old (linked via ReplacedByToken)
        var newToken = IdentityManager.GenerateRefreshToken(userDto.Id);
        await repository.RevokeRefreshTokenAsync(refreshTokenString, "Rotated", newToken.Token, ct);
        await repository.SetRefreshTokenAsync(userDto.Id, newToken, ct);
        context.SetRefreshTokenCookie(newToken);

        return Results.Ok(ApiResponse.Success(new AccessTokenModel
        {
            Token = new JwtSecurityTokenHandler().WriteToken(jwt),
            TokenType = "bearer",
            ExpiresToken = jwt.ValidTo,
            UserDto = userDto
        }));
    }
    private static async Task<IResult> Logout(
        HttpContext context,
        [FromServices] IUserRepository repository,
        CancellationToken ct)
    {
        var refreshToken = context.Request.Cookies["refreshToken"];
        if (string.IsNullOrWhiteSpace(refreshToken))
            return Results.Ok(ApiResponse.Fail(HttpStatusCode.BadRequest, "No refresh token cookie found."));

        await repository.RevokeRefreshTokenAsync(refreshToken, "User logged out", null, ct);
        context.RemoveRefreshTokenCookie();

        return Results.Ok(ApiResponse.Success("Logged out successfully."));
    }

    private static async Task<IResult> GetRecentOrdersByUser(
        [FromRoute] Guid userId,
        [FromServices] IUserRepository repository,
        [FromServices] IMapper mapper,
        CancellationToken ct)
    {
        var user = await repository.GetUserByIdAsync(userId, false, ct);
        if (user == null)
            return Results.NotFound(ApiResponse.Fail(HttpStatusCode.NotFound, "User not found."));

        var recentOrders = await repository.GetRecentOrdersByUserAsync(
            userId,
            recentDays: 14,
            q => q.ProjectToType<OrderDto>(),
            ct);

        return Results.Ok(ApiResponse.Success(recentOrders));
    }

    #endregion

    #region POST METHODS

    private static async Task<IResult> Login(
        HttpContext context,
        [FromBody] UserLoginModel model,
        [FromServices] IUserRepository repository,
        [FromServices] IMapper mapper,
        [FromServices] IConfiguration configuration,
        CancellationToken ct)
    {
        var user = mapper.Map<User>(model);
        var result = await repository.LoginAsync(user, ct);

        if (result.Status == LoginStatus.Banned)
        {
            var banMessage = result.BanStatus == BanStatus.Permanent
                ? "Your account has been permanently banned."
                : $"Your account is banned until {result.BannedUntil:yyyy-MM-dd HH:mm} UTC. Reason: {result.BanReason ?? "No reason provided."}";

            return Results.Ok(ApiResponse.Fail(HttpStatusCode.Forbidden, banMessage));
        }

        if (result.Status != LoginStatus.Success || result.AuthenticatedUser == null)
            return Results.Ok(ApiResponse.Fail(
                HttpStatusCode.Unauthorized,
                IdentityManager.LoginResultMessage(result.Status)));

        var userDto = mapper.Map<UserDto>(result.AuthenticatedUser);
        var token = userDto.GenerateJwt(configuration);

        var existingToken = await repository.GetActiveRefreshTokenByUserIdAsync(userDto.Id, ct);
        if (existingToken == null)
        {
            var newRefreshToken = IdentityManager.GenerateRefreshToken(userDto.Id);
            await repository.SetRefreshTokenAsync(userDto.Id, newRefreshToken, ct);
            context.SetRefreshTokenCookie(newRefreshToken);
        }
        else
        {
            context.SetRefreshTokenCookie(existingToken);
        }

        return Results.Ok(ApiResponse.Success(new AccessTokenModel
        {
            Token = new JwtSecurityTokenHandler().WriteToken(token),
            TokenType = "bearer",
            ExpiresToken = token.ValidTo,
            UserDto = userDto
        }));
    }

    private static async Task<IResult> Register(
        [FromBody] RegisterModel model,
        [FromServices] IUserService service,
        [FromServices] IUserRepository repository,
        [FromServices] IMapper mapper,
        CancellationToken ct)
    {
        try
        {
            var dto = mapper.Map<CreateUserDto>(model);
            var newUser = await service.RegisterAsync(dto, ct);

            if (newUser == null)
                return Results.Ok(ApiResponse.Fail(HttpStatusCode.BadRequest, "Failed to create user."));

            // Re-fetch with roles for full DTO
            var fullUser = await repository.GetUserByIdAsync(newUser.Id, getFull: true, ct);
            if (fullUser == null)
                return Results.Ok(ApiResponse.Fail(HttpStatusCode.InternalServerError, 
                    "User created but failed to retrieve full details."));

            return Results.Ok(ApiResponse.Success(mapper.Map<UserDto>(fullUser)));
        }
        catch (InvalidOperationException ex)
        {
            return Results.Ok(ApiResponse.Fail(HttpStatusCode.BadRequest, ex.Message));
        }
    }


    #endregion

    #region PUT METHODS

    private static async Task<IResult> UpdateUser(
        [FromBody] UserEditModel model,
        HttpContext context,
        [FromServices] IUserService service,
        [FromServices] IUserRepository repository,
        [FromServices] IMapper mapper,
        CancellationToken ct)
    {
        var identity = context.GetCurrentUser();
        if (identity == null)
            return Results.Unauthorized();

        try
        {
            var dto = mapper.Map<UpdateUserDto>((identity.Id, model));
            var success = await service.UpdateAsync(dto, ct);

            if (!success)
                return Results.NotFound(ApiResponse.Fail(HttpStatusCode.NotFound, "User not found."));

            // Re-fetch for updated response
            var user = await repository.GetUserByIdAsync(identity.Id, getFull: true, ct);
            if (user == null)
                return Results.Ok(ApiResponse.Fail(HttpStatusCode.InternalServerError, 
                    "User updated but failed to retrieve full details."));

            return Results.Ok(ApiResponse.Success(mapper.Map<UserDto>(user)));
        }
        catch (InvalidOperationException ex)
        {
            return Results.BadRequest(ApiResponse.Fail(HttpStatusCode.BadRequest, ex.Message));
        }
    }

    private static async Task<IResult> ChangePassword(
        [FromBody] PasswordEditModel model,
        HttpContext context,
        [FromServices] IUserService service,
        CancellationToken ct)
    {
        var identity = context.GetCurrentUser();
        if (identity == null)
            return Results.Unauthorized();

        try
        {
            var success = await service.ChangePasswordAsync(
                identity.Id, model.OldPassword, model.NewPassword, ct);

            return success
                ? Results.Ok(ApiResponse.Success("Password changed successfully."))
                : Results.Ok(ApiResponse.Fail(HttpStatusCode.BadRequest, "Old password is incorrect."));
        }
        catch (InvalidOperationException ex)
        {
            return Results.BadRequest(ApiResponse.Fail(HttpStatusCode.BadRequest, ex.Message));
        }
    }

    private static async Task<IResult> ResetPassword(
        [FromRoute] Guid userId,
        [FromBody] PasswordResetModel model,
        [FromServices] IUserService service,
        CancellationToken ct)
    {
        try
        {
            var success = await service.ResetPasswordAsync(userId, model.NewPassword, ct);

            return success
                ? Results.Ok(ApiResponse.Success("Password reset successfully."))
                : Results.NotFound(ApiResponse.Fail(HttpStatusCode.NotFound, "User not found."));
        }
        catch (InvalidOperationException ex)
        {
            return Results.BadRequest(ApiResponse.Fail(HttpStatusCode.BadRequest, ex.Message));
        }
    }

    private static async Task<IResult> UpdateUserRoles(
        [FromBody] UserRolesEditModel model,
        [FromServices] IUserService service,
        [FromServices] IUserRepository repository,
        [FromServices] IMapper mapper,
        CancellationToken ct)
    {
        try
        {
            var success = await service.UpdateRolesAsync(model.UserId, model.RolesId, ct);

            if (!success)
                return Results.NotFound(ApiResponse.Fail(HttpStatusCode.NotFound, "User not found."));

            var user = await repository.GetUserByIdAsync(model.UserId, getFull: true, ct);
            if (user == null)
            return Results.Ok(ApiResponse.Fail(HttpStatusCode.InternalServerError, 
                "User updated but failed to retrieve full details."));
                
            return Results.Ok(ApiResponse.Success(mapper.Map<UserDto>(user)));
        }
        catch (InvalidOperationException ex)
        {
            return Results.BadRequest(ApiResponse.Fail(HttpStatusCode.BadRequest, ex.Message));
        }
    }

    private static async Task<IResult> BanUser(
        [FromBody] BanUserModel model,
        [FromServices] IUserService service,
        CancellationToken ct)
    {
        try
        {
            var success = await service.BanAsync(
                model.UserId, model.IsPermanent, model.DurationDays, model.BanReason, ct);

            return success
                ? Results.Ok(ApiResponse.Success("User banned successfully."))
                : Results.NotFound(ApiResponse.Fail(HttpStatusCode.NotFound, "User not found."));
        }
        catch (InvalidOperationException ex)
        {
            return Results.BadRequest(ApiResponse.Fail(HttpStatusCode.BadRequest, ex.Message));
        }
    }

    private static async Task<IResult> UnbanUser(
        [FromRoute] Guid id,
        [FromServices] IUserService service,
        CancellationToken ct)
    {
        try
        {
            var success = await service.UnbanAsync(id, ct);

            return success
                ? Results.Ok(ApiResponse.Success("User unbanned successfully."))
                : Results.NotFound(ApiResponse.Fail(HttpStatusCode.NotFound, "User not found."));
        }
        catch (InvalidOperationException ex)
        {
            return Results.BadRequest(ApiResponse.Fail(HttpStatusCode.BadRequest, ex.Message));
        }
    }

    #endregion

    #region DELETE METHODS

    private static async Task<IResult> ToggleDeleteUser(
        [FromRoute] Guid id,
        [FromServices] IUserService service,
        CancellationToken ct)
    {
        var success = await service.ToggleSoftDeleteAsync(id, ct);

        return success
            ? Results.NoContent()
            : Results.NotFound(ApiResponse.Fail(HttpStatusCode.NotFound, "User not found."));
    }

    #endregion
}