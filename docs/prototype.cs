// public static class UserEndpoints
// {
//     public static WebApplication MapAccountEndpoints(this WebApplication app)
//     {
//         var builder = app.MapGroup("/api/account");

//         #region Get Method

//         builder.MapGet("/refreshToken", RefreshToken)
//             .WithName("RefreshToken")
//             .AllowAnonymous()
//             .Produces<ApiResponse<AccessTokenModel>>();

//         builder.MapGet("/logout", Logout)
//             .WithName("DeleteRefreshTokenAsync")
//             .AllowAnonymous();

//         builder.MapGet("/getUsers", GetUsers)
//             .WithName("GetUsers")
//             .RequireAuthorization("RequireAdminRole")
//             .Produces<ApiResponse<PaginationResult<UserDto>>>();

//         builder.MapGet("/roles", GetRoles)
//             .WithName("GetRolesAsync")
//             .Produces<ApiResponse<IList<RoleDto>>>()
//             .RequireAuthorization("RequireAdminRole")
//             .Produces(StatusCodes.Status401Unauthorized)
//             .Produces(StatusCodes.Status403Forbidden);

//         builder.MapGet("/getProfile", GetProfile)
//             .WithName("GetProfile")
//             .RequireAuthorization()
//             .Produces<ApiResponse<UserDto>>();

//         #endregion

//         #region Post Method

//         builder.MapPost("/login", Login)
//             .WithName("LoginAsync")
//             .AllowAnonymous()
//             .Produces<ApiResponse<AccessTokenModel>>();

//         builder.MapPost("/register", Register)
//             .WithName("RegisterAsync")
//             .AddEndpointFilter<ValidatorFilter<RegisterModel>>()
//             .Produces<ApiResponse<UserDto>>();

//         #endregion

//         #region Put Method

//         builder.MapPut("/updateUserRoles", UpdateUserRoles)
//             .WithName("UpdateUserRoles")
//             .RequireAuthorization("RequireAdminRole")
//             .Produces<ApiResponse<UserDto>>()
//             .Produces(StatusCodes.Status401Unauthorized)
//             .Produces(StatusCodes.Status403Forbidden);

//         builder.MapPut("/updateProfile", UpdateProfile)
//             .WithName("UpdateProfile")
//             //.AddEndpointFilter<ValidatorFilter<UserEditModel>>()
//             .RequireAuthorization()
//             .Produces<ApiResponse<UserDto>>();

//         builder.MapPut("/changePassword", ChangePassword)
//             .WithName("ChangePassword")
//             .AddEndpointFilter<ValidatorFilter<PasswordEditModel>>()
//             .RequireAuthorization()
//             .Produces<ApiResponse<UserDto>>();

//         #endregion

//         return app;
//     }

//     private static async Task<IResult> Login(
//         HttpContext context,
//         [FromBody] UserLoginModel model,
//         [FromServices] IUserRepository repository,
//         [FromServices] IConfiguration configuration,
//         [FromServices] IMapper mapper)
//     {
//         try
//         {
//             // Map incoming model to entity for authentication
//             var user = mapper.Map<User>(model);
//             var result = await user.Authenticate(repository);

//             if (result.Status != LoginStatus.Success)
//                 return Results.Ok(ApiResponse.Fail(HttpStatusCode.BadRequest, IdentityManager.LoginResultMessage(result.Status)));

//             // map authenticated user to dto
//             var userDto = mapper.Map<UserDto>(result.AuthenticatedUser ?? result.User);

//             // generate access token (JWT)
//             var token = userDto.GenerateJwt(configuration);

//             // generate refresh token entity (DB-ready)
//             var refreshToken = IdentityManager.GenerateRefreshToken(userDto.Id);

//             // save refresh token to DB
//             await repository.SetRefreshTokenAsync(userDto.Id, refreshToken);

//             // set secure cookie
//             context.SetRefreshTokenCookie(refreshToken);

//             // build response
//             var accessToken = new AccessTokenModel
//             {
//                 Token = new JwtSecurityTokenHandler().WriteToken(token),
//                 TokenType = "bearer",
//                 ExpiresToken = token.ValidTo,
//                 UserDto = userDto
//             };

//             return Results.Ok(ApiResponse.Success(accessToken));
//         }
//         catch (Exception e)
//         {
//             return Results.Ok(ApiResponse.Fail(HttpStatusCode.BadRequest, e.Message));
//         }
//     }

//     private static async Task<IResult> RefreshToken(
//         HttpContext context,
//         [FromServices] IUserRepository repository,
//         [FromServices] IMapper mapper,
//         [FromServices] IConfiguration configuration)
//     {
//         try
//         {
//             var refreshTokenString = context.Request.Cookies["refreshToken"];
//             if (string.IsNullOrWhiteSpace(refreshTokenString))
//                 return Results.Ok(ApiResponse.Fail(HttpStatusCode.Unauthorized, "Refresh token cookie is missing."));

//             // 1) find token entity
//             var tokenEntity = await repository.GetRefreshTokenAsync(refreshTokenString);
//             if (tokenEntity == null)
//                 return Results.Ok(ApiResponse.Fail(HttpStatusCode.Unauthorized, "Refresh token not found."));

//             // 2) check expiry (use UTC)
//             if (tokenEntity.TokenExpires <= DateTime.UtcNow)
//             {
//                 // token expired: delete it from DB and force re-login
//                 await repository.DeleteRefreshTokenAsync(refreshTokenString);
//                 context.RemoveRefreshTokenCookie();
//                 return Results.Ok(ApiResponse.Fail(HttpStatusCode.Unauthorized, "Refresh token expired. Please login again."));
//             }

//             // 3) load user (full data with roles)
//             var user = await repository.GetUserByIdAsync(tokenEntity.UserId, getFull: true);
//             if (user == null)
//             {
//                 await repository.DeleteRefreshTokenAsync(refreshTokenString);
//                 context.RemoveRefreshTokenCookie();
//                 return Results.Ok(ApiResponse.Fail(HttpStatusCode.Unauthorized, "Associated user not found."));
//             }

//             // 4) create new JWT for user
//             var userDto = mapper.Map<UserDto>(user);
//             var jwt = userDto.GenerateJwt(configuration);

//             // 5) rotate refresh token:
//             // - delete old token (the one presented)
//             // - create & save new token for same user
//             await repository.DeleteRefreshTokenAsync(refreshTokenString);

//             var newToken = IdentityManager.GenerateRefreshToken(userDto.Id);
//             await repository.SetRefreshTokenAsync(userDto.Id, newToken);

//             // 6) set new cookie
//             context.SetRefreshTokenCookie(newToken);

//             // 7) return new access token
//             var accessToken = new AccessTokenModel
//             {
//                 Token = new JwtSecurityTokenHandler().WriteToken(jwt),
//                 TokenType = "bearer",
//                 ExpiresToken = jwt.ValidTo,
//                 UserDto = userDto
//             };

//             return Results.Ok(ApiResponse.Success(accessToken));
//         }
//         catch (Exception e)
//         {
//             return Results.Ok(ApiResponse.Fail(HttpStatusCode.BadRequest, e.Message));
//         }
//     }

//     private static async Task<IResult> Logout(
//         HttpContext context,
//         [FromServices] IUserRepository repository)
//     {
//         try
//         {
//             var refreshToken = context.Request.Cookies["refreshToken"];
//             if (string.IsNullOrWhiteSpace(refreshToken))
//                 return Results.Ok(ApiResponse.Fail(HttpStatusCode.BadRequest, "No refresh token cookie found."));

//             var existing = await repository.GetRefreshTokenAsync(refreshToken);
//             if (existing != null)
//             {
//                 await repository.DeleteRefreshTokenAsync(refreshToken);
//             }

//             context.RemoveRefreshTokenCookie();

//             return Results.Ok(ApiResponse.Success("Logged out (refresh token deleted)."));
//         }
//         catch (Exception e)
//         {
//             return Results.Ok(ApiResponse.Fail(HttpStatusCode.BadRequest, e.Message));
//         }
//     }

//     private static async Task<IResult> ChangePassword(
//         PasswordEditModel model,
//         HttpContext context,
//         [FromServices] IUserRepository repository,
//         [FromServices] IMapper mapper)
//     {
//         try
//         {
//             var identity = context.GetCurrentUser();
//             if (identity == null)
//                 return Results.Ok(ApiResponse.Fail(HttpStatusCode.Unauthorized, "User not authenticated."));

//             var user = await repository.GetUserByIdAsync(identity.Id);
//             if (user == null)
//                 return Results.Ok(ApiResponse.Fail(HttpStatusCode.NotFound, "User not found."));

//             if (await repository.ChangePasswordAsync(user, model.OldPassword, model.NewPassword))
//             {
//                 var userDto = mapper.Map<UserDto>(user);
//                 return Results.Ok(ApiResponse.Success(userDto));
//             }

//             return Results.Ok(ApiResponse.Fail(HttpStatusCode.BadRequest, "Old password is incorrect."));
//         }
//         catch (Exception e)
//         {
//             return Results.Ok(ApiResponse.Fail(HttpStatusCode.BadRequest, e.Message));
//         }
//     }

//     private static async Task<IResult> Register(
//         [FromBody] RegisterModel model,
//         [FromServices] IUserRepository repository,
//         [FromServices] IConfiguration configuration,
//         [FromServices] IMapper mapper)
//     {
//         try
//         {
//             var user = mapper.Map<User>(model);

//             var userExist = await repository.IsUserExistedAsync(user.UserName);
//             if (userExist)
//             {
//                 return Results.Ok(ApiResponse.Fail(HttpStatusCode.BadRequest, "Account already exists."));
//             }

//             var newUser = await repository.RegisterAsync(user);
//             var userDto = mapper.Map<UserDto>(newUser);

//             return Results.Ok(ApiResponse.Success(userDto));
//         }
//         catch (Exception e)
//         {
//             return Results.Ok(ApiResponse.Fail(HttpStatusCode.BadRequest, e.Message));
//         }
//     }

//     private static async Task<IResult> UpdateUserRoles(
//         [FromBody] UserRolesEditModel model,
//         [FromServices] IUserRepository repository,
//         [FromServices] IConfiguration configuration,
//         [FromServices] IMapper mapper)
//     {
//         try
//         {
//             var user = await repository.GetUserByIdAsync(model.UserId, true);
//             if (user == null)
//             {
//                 return Results.Ok(ApiResponse.Fail(HttpStatusCode.NotFound, "User not found."));
//             }

//             var newUser = await repository.SetUserRolesAsync(user.Id, model.RolesIdList);
//             var userDto = mapper.Map<UserDto>(newUser);

//             return Results.Ok(ApiResponse.Success(userDto));
//         }
//         catch (Exception e)
//         {
//             return Results.Ok(ApiResponse.Fail(HttpStatusCode.BadRequest, e.Message));
//         }
//     }

//     private static async Task<IResult> UpdateProfile(
//         UserEditModel model,
//         HttpContext context,
//         [FromServices] IUserRepository repository,
//         [FromServices] IMapper mapper)
//     {
//         try
//         {
//             var identity = IdentityManager.GetCurrentUser(context);
//             if (identity == null)
//                 return Results.Ok(ApiResponse.Fail(HttpStatusCode.Unauthorized, "Not authenticated."));

//             var user = await repository.GetUserByIdAsync(identity.Id);
//             if (user == null)
//                 return Results.Ok(ApiResponse.Fail(HttpStatusCode.NotFound, "User not found."));

//             mapper.Map(model, user);

//             var result = await repository.UpdateProfileAsync(user);
//             if (result == null)
//                 return Results.Ok(ApiResponse.Fail(HttpStatusCode.BadRequest, "Update failed."));

//             var userDto = mapper.Map<UserDto>(user);
//             return Results.Ok(ApiResponse.Success(userDto));
//         }
//         catch (Exception e)
//         {
//             return Results.Ok(ApiResponse.Fail(HttpStatusCode.BadRequest, e.Message));
//         }
//     }

//     private static async Task<IResult> GetUsers(
//         [AsParameters] UserFilterModel model,
//         [FromServices] IUserRepository repository,
//         [FromServices] IMapper mapper)
//     {
//         try
//         {
//             var userQuery = mapper.Map<UserQuery>(model);

//             var userList = await repository.GetPagedUsersAsync(
//                 userQuery,
//                 model,
//                 p => p.ProjectToType<UserDto>());

//             return Results.Ok(ApiResponse.Success(userList));
//         }
//         catch (Exception e)
//         {
//             return Results.Ok(ApiResponse.Fail(HttpStatusCode.BadRequest, e.Message));
//         }
//     }

//     private static async Task<IResult> GetProfile(
//         HttpContext context,
//         [FromServices] IUserRepository repository,
//         [FromServices] IMapper mapper)
//     {
//         try
//         {
//             var identity = context.GetCurrentUser();
//             if (identity == null)
//                 return Results.Ok(ApiResponse.Fail(HttpStatusCode.Unauthorized, "Not authenticated."));

//             var user = await repository.GetUserByIdAsync(identity.Id);
//             if (user == null)
//                 return Results.Ok(ApiResponse.Fail(HttpStatusCode.NotFound, "User not found."));

//             var userDto = mapper.Map<UserDto>(user);
//             return Results.Ok(ApiResponse.Success(userDto));
//         }
//         catch (Exception e)
//         {
//             return Results.Ok(ApiResponse.Fail(HttpStatusCode.BadRequest, e.Message));
//         }
//     }

//     private static async Task<IResult> GetRoles(
//         [FromServices] IUserRepository repository,
//         [FromServices] IMapper mapper)
//     {
//         try
//         {
//             var roles = await repository.GetRolesAsync();
//             var listRoles = mapper.Map<IList<RoleDto>>(roles);

//             return Results.Ok(ApiResponse.Success(listRoles));
//         }
//         catch (Exception e)
//         {
//             return Results.Ok(ApiResponse.Fail(HttpStatusCode.BadRequest, e.Message));
//         }
//     }
// }
