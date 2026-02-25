using LoLStore.Core.Contracts;

namespace LoLStore.Core.Entities;

public enum BanStatus
{
    None = 0,
    Temporary = 1,
    Permanent = 2
}

public class User : BaseEntity
{    
    // Required fields
    public string Name { get; set; } = string.Empty;
    public DateTime CreatedDate { get; set; } = DateTime.UtcNow;
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string UserName { get; set; } = string.Empty;
    
    // Optional fields
    public string? Phone { get; set; }
    public string? Address { get; set; }

    // Ban status
    public BanStatus BanStatus { get; set; } = BanStatus.None;
    public DateTime? BannedUntil { get; set; }
    public string? BanReason { get; set; }
    public bool IsBanned =>
        BanStatus == BanStatus.Permanent ||
        (BanStatus == BanStatus.Temporary && BannedUntil.HasValue && BannedUntil > DateTime.UtcNow);

    // Navigation properties
    public IList<Role> Roles { get; set; } = new List<Role>();
    public IList<UserRefreshToken> RefreshTokens { get; set; } = new List<UserRefreshToken>();
    public IList<Order> Orders { get; set; } = new List<Order>();
    public IList<ProductHistory> ProductHistories { get; set; } = new List<ProductHistory>();
}