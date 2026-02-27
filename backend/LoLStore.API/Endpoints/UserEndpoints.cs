using System.IdentityModel.Tokens.Jwt;
using System.Net;
using LoLStore.API.Filter;
using LoLStore.API.Identities;
using LoLStore.API.Models;
using LoLStore.API.Models.UserModel;
using LoLStore.Core.Entities;
using LoLStore.Core.Queries;
using LoLStore.Services.Shop;
using Microsoft.AspNetCore.Mvc;
using MapsterMapper;
using Mapster;
using LoLStore.API.Models.OrderModel;

namespace LoLStore.API.Endpoints;

public static class UserEndpoints
{
    public static WebApplication MapAccountEndpoints(
        this WebApplication app)
    {
        var builder = app.MapGroup("/api/account");

        # region Get Method
        builder.MapGet("/refreshToken", RefreshToken)
            .WithName("RefreshToken")
            .AllowAnonymous()
            .Produces<ApiResponse<AccessTokenModel>>();

        builder.MapGet("/logout", Logout)
            .WithName("DeleteRefreshTokenAsync")
            .AllowAnonymous();

        builder.MapGet("/{userId:guid}", GetUserById)
            .WithName("GetUserById")
            .RequireAuthorization("RequireAdminRole")
            .Produces<ApiResponse<UserDto>>();

        builder.MapGet("/getUsers", GetUsers)
            .WithName("GetUsers")
            .RequireAuthorization("RequireAdminRole")
            .Produces<ApiResponse<PaginationResult<UserDto>>>();

        builder.MapGet("/roles", GetRoles)
            .WithName("GetRolesAsync")
            .RequireAuthorization("RequireAdminRole")
            .Produces<ApiResponse<IList<RoleDto>>>();

        builder.MapGet("/users/{userId:guid}/orders", GetOrdersByUser)
            .WithName("GetOrdersByUser")
            .RequireAuthorization("RequireAdminRole")
            .Produces<ApiResponse<PaginationResult<OrderDto>>>();

        builder.MapPut("/ban", BanUser)
            .WithName("BanUser")
            .RequireAuthorization("RequireAdminRole")
            .Produces<ApiResponse<string>>();

        builder.MapPut("/unban/{id:guid}", UnbanUser)
            .WithName("UnbanUser")
            .RequireAuthorization("RequireAdminRole")
            .Produces<ApiResponse<string>>();

        # endregion
        
        # region Post Method

        builder.MapPost("/login", Login)
            .WithName("LoginAsync")
            .AllowAnonymous()
            .Produces<ApiResponse<AccessTokenModel>>();

        builder.MapPost("/register", Register)
            .WithName("RegisterAsync")
            .AddEndpointFilter<ValidatorFilter<RegisterModel>>()
            .Produces<ApiResponse<UserDto>>();

        # endregion
        
        # region Put Method
        builder.MapPut("/updateUser", UpdateUser)
            .WithName("UpdateUser")
            .AddEndpointFilter<ValidatorFilter<UserEditModel>>()
            .Produces<ApiResponse<UserDto>>();

        builder.MapPut("/changePassword", ChangePassword)
            .WithName("ChangePassword")
            .AddEndpointFilter<ValidatorFilter<PasswordEditModel>>()
            .Produces<ApiResponse<UserDto>>();

        builder.MapPut("/users/{userId:guid}/resetPassword", ResetPassword)
            .WithName("ResetPassword")
            .RequireAuthorization("RequireAdminRole")
            .AddEndpointFilter<ValidatorFilter<PasswordResetModel>>()
            .Produces<ApiResponse<UserDto>>();

        builder.MapPut("/updateUserRoles", UpdateUserRoles)
            .WithName("UpdateUserRoles")
            .RequireAuthorization("RequireAdminRole")
            .Produces<ApiResponse<UserDto>>();

        # endregion

        # region Delete Method
        
        # endregion

        return app;
    }

    private static async Task<IResult> Login(
    HttpContext context,
    [FromBody] UserLoginModel model,
    [FromServices] IUserRepository repository,
    [FromServices] IMapper mapper,
    [FromServices] IConfiguration configuration)
    {
        var user = mapper.Map<User>(model);

        var result = await repository.LoginAsync(user);

        if (result.Status == LoginStatus.Banned)
        {
            var banMessage = result.BanStatus == BanStatus.Permanent
                ? "Your account has been permanently banned."
                : $"Your account is banned until {result.BannedUntil:yyyy-MM-dd HH:mm} UTC. Reason: {result.BanReason ?? "No reason provided."}";

            return Results.Ok(ApiResponse.Fail(HttpStatusCode.Forbidden, banMessage));
        }

        if (result.Status != LoginStatus.Success || result.AuthenticatedUser == null)
        {
            return Results.Ok(ApiResponse.Fail(
                HttpStatusCode.Unauthorized,
                IdentityManager.LoginResultMessage(result.Status)
            ));
        }

        var userDto = mapper.Map<UserDto>(result.AuthenticatedUser);

        var token = userDto.GenerateJwt(configuration);

        var refreshToken = IdentityManager.GenerateRefreshToken(userDto.Id);

        await repository.SetRefreshTokenAsync(userDto.Id, refreshToken);

        context.SetRefreshTokenCookie(refreshToken);

        var accessToken = new AccessTokenModel
        {
            Token = new JwtSecurityTokenHandler().WriteToken(token),
            TokenType = "bearer",
            ExpiresToken = token.ValidTo,
            UserDto = userDto
        };

        return Results.Ok(ApiResponse.Success(accessToken));
    }

    private static async Task<IResult> RefreshToken(
        HttpContext context,
        [FromServices] IUserRepository repository,
        [FromServices] IMapper mapper,
        [FromServices] IConfiguration configuration)
    {
        var refreshTokenString = context.Request.Cookies["refreshToken"];
        if (string.IsNullOrWhiteSpace(refreshTokenString))
            return Results.Ok(ApiResponse.Fail(HttpStatusCode.Unauthorized, "Refresh token cookie is missing."));

        var tokenEntity = await repository.GetRefreshTokenAsync(refreshTokenString);
        if (tokenEntity == null)
            return Results.Ok(ApiResponse.Fail(HttpStatusCode.Unauthorized, "Refresh token not found."));

        if (tokenEntity.Expires <= DateTime.UtcNow)
        {
            // token expired: delete it from DB and force re-login
            await repository.DeleteRefreshTokenAsync(refreshTokenString);
            context.RemoveRefreshTokenCookie();
            return Results.Ok(ApiResponse.Fail(HttpStatusCode.Unauthorized, "Refresh token expired. Please login again."));
        }

        var user = await repository.GetUserByIdAsync(tokenEntity.UserId, getFull: true);
        if (user == null)
        {
            await repository.DeleteRefreshTokenAsync(refreshTokenString);
            context.RemoveRefreshTokenCookie();
            return Results.Ok(ApiResponse.Fail(HttpStatusCode.Unauthorized, "Associated user not found."));
        }

        var userDto = mapper.Map<UserDto>(user);
        var jwt = userDto.GenerateJwt(configuration);

        await repository.DeleteRefreshTokenAsync(refreshTokenString);

        var newToken = IdentityManager.GenerateRefreshToken(userDto.Id);
        await repository.SetRefreshTokenAsync(userDto.Id, newToken);

        context.SetRefreshTokenCookie(newToken);

        var accessToken = new AccessTokenModel
        {
            Token = new JwtSecurityTokenHandler().WriteToken(jwt),
            TokenType = "bearer",
            ExpiresToken = jwt.ValidTo,
            UserDto = userDto
        };

        return Results.Ok(ApiResponse.Success(accessToken));
    }

    private static async Task<IResult> Logout(
        HttpContext context,
        [FromServices] IUserRepository repository)
    {
        var refreshToken = context.Request.Cookies["refreshToken"];
        if (string.IsNullOrWhiteSpace(refreshToken))
            return Results.Ok(ApiResponse.Fail(HttpStatusCode.BadRequest, "No refresh token cookie found."));

        var existing = await repository.GetRefreshTokenAsync(refreshToken);
        if (existing != null)
        {
            await repository.DeleteRefreshTokenAsync(refreshToken);
        }

        context.RemoveRefreshTokenCookie();

        return Results.Ok(ApiResponse.Success("Logged out (refresh token deleted)."));
    }

    private static async Task<IResult> Register(
        [FromBody] RegisterModel model,
        [FromServices] IUserRepository repository,
        [FromServices] IConfiguration configuration,
        [FromServices] IMapper mapper)
    {
        // Check username BEFORE mapping to entity
        var userExist = await repository.IsUserExistedAsync(model.UserName);
        if (userExist)
        {
            return Results.Ok(ApiResponse.Fail(HttpStatusCode.BadRequest, "Account already exists."));
        }

        // Now map to entity after verifying
        var user = mapper.Map<User>(model);

        // Create user
        var newUser = await repository.RegisterAsync(user);
        if (newUser == null)
        {
            return Results.Ok(ApiResponse.Fail(HttpStatusCode.BadRequest, "Failed to create user."));
        }

        var userDto = mapper.Map<UserDto>(newUser);
        return Results.Ok(ApiResponse.Success(userDto));
    }

    private static async Task<IResult> GetUsers(
        [AsParameters] UserManagerFilterModel model,
        [FromServices] IUserRepository repository,
        [FromServices] IMapper mapper)
    {
        var userQuery = mapper.Map<UserQuery>(model);

        var userList = await repository.GetPagedUsersAsync(
            userQuery,
            model,
            p => p.ProjectToType<UserAdminDto>()); 

        return Results.Ok(ApiResponse.Success(userList));
    }

    private static async Task<IResult> GetRoles(
        [FromServices] IUserRepository userRepository,
        [FromServices] IMapper mapper)
    {
        var roles = await userRepository.GetRolesAsync();
        var listRoles = mapper.Map<IList<RoleDto>>(roles);

        return Results.Ok(ApiResponse.Success(listRoles));
    }

    private static async Task<IResult> ChangePassword(
        [FromBody] PasswordEditModel model,
        HttpContext context,
        [FromServices] IUserRepository repository,
        [FromServices] IMapper mapper)
    {
        // Check for authenticated user
        var identity = context.GetCurrentUser();
        if (identity == null)
        {
            return Results.Ok(ApiResponse.Fail(HttpStatusCode.Unauthorized, "User not authenticated.")
            );
        }

        // Get user from database
        var user = await repository.GetUserByIdAsync(identity.Id);
        if (user == null)
        {
            return Results.Ok(ApiResponse.Fail(HttpStatusCode.NotFound, "User not found."));
        }

        // Change password
        if (await repository.ChangePasswordAsync(user, model.OldPassword, model.NewPassword))
        {
            var userDto = mapper.Map<UserDto>(user);
            return Results.Ok(ApiResponse.Success(userDto));
        }

        return Results.Ok(ApiResponse.Fail(HttpStatusCode.BadRequest, "Failed to change password. Old password may be incorrect."));
    }

    private static async Task<IResult> ResetPassword(
        [FromRoute] Guid userId,
        [FromBody] PasswordResetModel model,
        [FromServices] IUserRepository repository,
        [FromServices] IMapper mapper)
    {
        var user = await repository.GetUserByIdAsync(userId);
        if (user == null)        {
            return Results.Ok(ApiResponse.Fail(HttpStatusCode.NotFound, "User not found."));
        }

        if (await repository.ResetPasswordAsync(user, model.NewPassword))
        {
            var userDto = mapper.Map<UserDto>(user);
            return Results.Ok(ApiResponse.Success(userDto));
        }

        return Results.Ok(ApiResponse.Fail(HttpStatusCode.BadRequest, "Failed to reset password."));
    }

    private static async Task<IResult> UpdateUserRoles(
        [FromBody] UserRolesEditModel model,
        [FromServices] IUserRepository repository,
        [FromServices] IConfiguration configuration,
        [FromServices] IMapper mapper)
    {
        var user = await repository.GetUserByIdAsync(model.UserId, getFull: true);
        if (user == null)
        {
            return Results.Ok(ApiResponse.Fail(
                HttpStatusCode.NotFound,
                "User not found."
            ));
        }

        var updatedUser = await repository.UpdateUserRolesAsync(user.Id, model.RolesId);

        if (updatedUser == null)
        {
            return Results.Ok(ApiResponse.Fail(
                HttpStatusCode.BadRequest,
                "Failed to update user roles."
            ));
        }
        
        var userDto = mapper.Map<UserDto>(updatedUser);
        return Results.Ok(ApiResponse.Success(userDto));
    }

    private static async Task<IResult> BanUser(
        [FromBody] BanUserModel model,
        [FromServices] IUserRepository repository)
    {
        if (!model.IsPermanent && (model.DurationDays == null || model.DurationDays <= 0))
            return Results.Ok(ApiResponse.Fail(HttpStatusCode.BadRequest, "DurationDays must be a positive number for temporary bans."));

        var result = await repository.BanUserAsync(
            model.UserId,
            model.IsPermanent,
            model.DurationDays,
            model.BanReason);

        if (!result)
            return Results.Ok(ApiResponse.Fail(HttpStatusCode.NotFound, "User not found."));

        return Results.Ok(ApiResponse.Success("User banned successfully."));
    }

    private static async Task<IResult> UnbanUser(
        [FromRoute] Guid id,
        [FromServices] IUserRepository repository)
    {
        var result = await repository.UnbanUserAsync(id);

        if (!result)
            return Results.Ok(ApiResponse.Fail(HttpStatusCode.NotFound, "User not found."));

        return Results.Ok(ApiResponse.Success("User unbanned successfully."));
    }

    private static async Task<IResult> GetUserById(
        [FromRoute] Guid userId,
        [FromServices] IUserRepository repository,
        [FromServices] IMapper mapper)
    {
        var user = await repository.GetUserByIdAsync(userId, getFull: true);
        if (user == null)
            return Results.Ok(ApiResponse.Fail(HttpStatusCode.NotFound, "User not found."));

        var userDto = mapper.Map<UserDto>(user);
        return Results.Ok(ApiResponse.Success(userDto));
    }

    private static async Task<IResult> GetOrdersByUser(
        [FromRoute] Guid userId,
        [AsParameters] PagingModel pagingParams,
        [FromServices] IUserRepository repository,
        [FromServices] IMapper mapper)
    {
        var user = await repository.GetUserByIdAsync(userId);
        if (user == null)
            return Results.Ok(ApiResponse.Fail(HttpStatusCode.NotFound, "User not found."));

        var orders = await repository.GetPagedOrdersByUserAsync(
            userId,
            pagingParams,
            p => p.ProjectToType<OrderDto>());

        return Results.Ok(ApiResponse.Success(new PaginationResult<OrderDto>(orders)));
    }

    private static async Task<IResult> UpdateUser(
        [FromBody] UserEditModel model,
        HttpContext context,
        [FromServices] IUserRepository repository,
        [FromServices] IMapper mapper)
    {
        // Check for authenticated user
        var identity = context.GetCurrentUser();
        if (identity == null)
        {
            return Results.Ok(ApiResponse.Fail(HttpStatusCode.Unauthorized, "User not authenticated."));
        }

       var success = await repository.UpdateUserAsync(  
           new User
           {
               Name = model.Name,
               Email = model.Email,
               Phone = model.Phone,
               Address = model.Address
           });
           
       if (!success)       {
           return Results.Ok(ApiResponse.Fail(HttpStatusCode.BadRequest, "Failed to update user information."));
       }

       return Results.Ok(ApiResponse.Success("User information updated successfully."));
    }
}