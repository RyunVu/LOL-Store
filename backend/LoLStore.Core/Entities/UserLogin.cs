using LoLStore.Core.Contracts;

namespace LoLStore.Core.Entities;

public class UserLogin : IEntity
{
    public Guid Id { get; set; }
    public string RefreshToken { get; set; }
    public DateTime TokenCreated { get; set; }
    public DateTime TokenExpires { get; set; }
    public User User { get; set; }
}

public enum LoginStatus
{
    None,
    UserName,
    Password,
    Success
}