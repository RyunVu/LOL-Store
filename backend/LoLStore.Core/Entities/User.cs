using LoLStore.Core.Contracts;

namespace LoLStore.Core.Entities;

public class User : IEntity
{
    public Guid Id { get; set; }
    
    // Required fields
    public string Name { get; set; } = string.Empty;
    public DateTime CreatedDate { get; set; } = DateTime.UtcNow;
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string UserName { get; set; } = string.Empty;
    
    // Optional fields
    public string? Phone { get; set; }
    public string? Address { get; set; }

    // Navigation properties
    public IList<Role> Roles { get; set; } = new List<Role>();
    public IList<UserRefreshToken> RefreshTokens { get; set; } = new List<UserRefreshToken>();
    public IList<Order> Orders { get; set; } = new List<Order>();
    public IList<ProductHistory> ProductHistories { get; set; } = new List<ProductHistory>();
}