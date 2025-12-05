using LoLStore.Core.Contracts;

namespace LoLStore.Core.Entities;

public class UserRefreshToken : IEntity, IRefreshToken
{
    public Guid Id { get; set; }
    public required string Token { get; set; }
    public DateTime Created { get; set; }
    public DateTime Expires { get; set; }
    public bool IsExpired => Expires <= DateTime.UtcNow;
    public User User { get; set; }
    public Guid UserId { get; set; }
}

public enum LoginStatus
{
    Success = 0,
    InvalidUsername = 1,
    InvalidPassword = 2
}