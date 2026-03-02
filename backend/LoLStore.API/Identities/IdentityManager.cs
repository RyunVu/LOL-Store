using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using LoLStore.API.Models.UserModel;
using LoLStore.Core.DTO;
using LoLStore.Core.Entities;
using LoLStore.Services.Shop.Users;
using Microsoft.IdentityModel.Tokens;
namespace LoLStore.API.Identities;

public static class IdentityManager
{
    /// <summary>
    /// Get currently authenticated user from HttpContext
    /// </summary>
    public static UserDto? GetCurrentUser(this HttpContext context)
    {
        if (context.User?.Identity is not ClaimsIdentity identity)
            return null;

        var claims = identity.Claims.ToList();

        var idValue = claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier)?.Value;
        
        if (!Guid.TryParse(idValue, out Guid userId))
            return null;

        return new UserDto
        {
            Id = userId,
            UserName = claims.FirstOrDefault(c => c.Type == ClaimTypes.Name)?.Value ?? string.Empty,
            Name = claims.FirstOrDefault(c => c.Type == ClaimTypes.GivenName)?.Value ?? string.Empty,
            Email = claims.FirstOrDefault(c => c.Type == ClaimTypes.Email)?.Value ?? string.Empty,
            Roles = identity
                .FindAll(ClaimTypes.Role)
                .Select(r => new RoleDto { Name = r.Value })
                .ToList(),
            PrimaryRole = identity.FindFirst(ClaimTypes.Role)?.Value ?? "User"
        };
    }

    /// <summary>
    /// Generate JWT Access Token
    /// </summary>
    public static JwtSecurityToken GenerateJwt(this UserDto user, IConfiguration config)
    {
        var keyString = config["Jwt:Key"];
        if (string.IsNullOrWhiteSpace(keyString))
            throw new Exception("JWT Key is missing in configuration.");

        var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(keyString));
        var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);

        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()), 
            new Claim(ClaimTypes.Name, user.UserName ?? string.Empty),
            new Claim(ClaimTypes.Email, user.Email ?? string.Empty),
            new Claim(ClaimTypes.GivenName, user.Name ?? string.Empty)
        };

        if (user.Roles != null)
        {
            foreach (var role in user.Roles)
                claims.Add(new Claim(ClaimTypes.Role, role.Name));
        }

        return new JwtSecurityToken(
            issuer: config["Jwt:Issuer"],
            audience: config["Jwt:Audience"],
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(15),
            signingCredentials: credentials
        );
    }

    public static async Task<LoginResult> Authenticate(this User userLogin, IUserRepository repository)
	{
		return await repository.LoginAsync(userLogin);
	}

    /// <summary>
    /// Convert login status to English message
    /// </summary>
    public static string LoginResultMessage(this LoginStatus status)
    {
        return status switch
        {
            LoginStatus.InvalidUsername => "Incorrect username.",
            LoginStatus.InvalidPassword => "Incorrect password.",
            _ => "Login failed."
        };
    }

    /// <summary>
    /// Generate a DB-ready UserRefreshToken for a specific user (entity).
    /// </summary>
    public static UserRefreshToken GenerateRefreshToken(Guid userId)
    {
        return new UserRefreshToken
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            Token = Convert.ToBase64String(RandomNumberGenerator.GetBytes(64)),
            Created = DateTime.UtcNow,
            Expires = DateTime.UtcNow.AddDays(15)
        };
    }

    /// <summary>
    /// Set cookie for a user refresh token (HTTP-only secure).
    /// This method only writes the cookie; saving to DB is the repository's job.
    /// </summary>
    public static void SetRefreshTokenCookie(this HttpContext context, UserRefreshToken token)
    {
        var cookieOptions = new CookieOptions
        {
            HttpOnly = true,
            Secure = true,
            SameSite = SameSiteMode.Strict,
            Expires = token.Expires,
            Path = "/"
            // Domain: leave default, or set explicitly if needed
        };

        context.Response.Cookies.Append("refreshToken", token.Token, cookieOptions);
    }

    /// <summary>
    /// Remove the refresh-token cookie
    /// </summary>
    public static void RemoveRefreshTokenCookie(this HttpContext context)
    {
        // remove cookie (client will clear)
        context.Response.Cookies.Delete("refreshToken", new CookieOptions
        {
            HttpOnly = true,
            Secure = true,
            SameSite = SameSiteMode.Strict,
            Path = "/"
        });
    }
}