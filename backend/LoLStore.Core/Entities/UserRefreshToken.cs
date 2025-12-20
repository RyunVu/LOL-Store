using LoLStore.Core.Contracts;

namespace LoLStore.Core.Entities;

public class UserRefreshToken : IEntity, IRefreshToken
{
    public Guid Id { get; set; }
    
    // Required field
    public required string Token { get; set; }
    
    public DateTime Created { get; set; } = DateTime.UtcNow;
    public DateTime Expires { get; set; }
    
    public bool IsExpired => Expires <= DateTime.UtcNow;
    
    // Navigation property
    public User User { get; set; } = null!;
    public Guid UserId { get; set; }
}

public enum LoginStatus
{
    Success = 0,
    InvalidUsername = 1,
    InvalidPassword = 2
}