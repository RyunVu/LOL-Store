using LoLStore.Core.Contracts;

namespace LoLStore.Core.Entities;

public class UserRefreshToken : IEntity, IRefreshToken
{
    public Guid Id { get; set; }
    public required string Token { get; set; }
    public DateTime Created { get; set; } = DateTime.UtcNow;
    public DateTime Expires { get; set; }
    public bool IsExpired => Expires <= DateTime.UtcNow;

    // --- Revocation ---
    public bool IsRevoked { get; set; } = false;
    public DateTime? RevokedAt { get; set; }
    public string? RevokedReason { get; set; }

    // --- Rotation: tracks which token replaced this one ---
    public string? ReplacedByToken { get; set; }

    // A token is only "active" if it hasn't expired AND hasn't been revoked
    public bool IsActive => !IsExpired && !IsRevoked;

    public User User { get; set; } = null!;
    public Guid UserId { get; set; }
}
public enum LoginStatus
{
    Success = 0,
    InvalidUsername = 1,
    InvalidPassword = 2,
    Banned = 3
}