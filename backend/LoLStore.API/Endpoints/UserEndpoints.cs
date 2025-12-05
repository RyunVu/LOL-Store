using System.IdentityModel.Tokens.Jwt;
using System.Net;
using LoLStore.API.Identities;
using LoLStore.API.Models;
using LoLStore.API.Models.UserModel;
using LoLStore.Core.Entities;
using LoLStore.Services.Shop;
using MapsterMapper;
using Microsoft.AspNetCore.Mvc;

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

        // builder.MapGet("/getUsers", GetUsers)
        //     .WithName("GetUser")
        //     .RequireAuthorization("RequireAdminRole")
        //     .Produces<ApiResponse<PaginationResult<UserDto>>>();

        // builder.MapGet("/roles", GetRoles)
        //     .WithName("GetRolesAsync")
        //     .RequireAuthorization("RequireAdminRole")
        //     .Produces<ApiResponse<IList<RoleDto>>>()
        //     .Produces(StatusCodes.Status401Unauthorized)
        //     .Produces(StatusCodes.Status403Forbidden);
        
        // builder.MapGet("/getProfile", GetProfile)
        //     .WithName("GetProfile")
        //     .RequireAuthorization()
        //     .Produces<ApiResponse<UserDto>>();
        # endregion
        
        # region Post Method

        builder.MapPost("/login", Login)
            .WithName("LoginAsync")
            .AllowAnonymous()
            .Produces<ApiResponse<AccessTokenModel>>();

        # endregion
        
        # region Put Method
        
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
        try
        {
            var user = mapper.Map<User>(model);

            var result = await repository.LoginAsync(user);

            if (result.Status != LoginStatus.Success)
                return Results.Ok(ApiResponse.Fail(
                    HttpStatusCode.BadRequest,
                    IdentityManager.LoginResultMessage(result.Status)
                ));

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
        catch (Exception e)
        {
            return Results.Ok(ApiResponse.Fail(HttpStatusCode.BadRequest, e.Message));
        }
    }

    private static async Task<IResult> RefreshToken(
        HttpContext context,
        [FromServices] IUserRepository repository,
        [FromServices] IMapper mapper,
        [FromServices] IConfiguration configuration)
    {
        try
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
        catch (Exception e)
        {
            return Results.Ok(ApiResponse.Fail(HttpStatusCode.BadRequest, e.Message));
        }
    }

    private static async Task<IResult> Logout(
        HttpContext context,
        [FromServices] IUserRepository repository)
    {
        try
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
        catch (Exception e)
        {
            return Results.Ok(ApiResponse.Fail(HttpStatusCode.BadRequest, e.Message));
        }
    }

}