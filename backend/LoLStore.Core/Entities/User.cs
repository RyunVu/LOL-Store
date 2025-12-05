using LoLStore.Core.Contracts;

namespace LoLStore.Core.Entities;

public class User : IEntity
{
    public Guid Id { get; set; }
    public string Name { get; set; }
    public DateTime CreatedDate { get; set; }
    public string Email { get; set; }
    public string Password { get; set; }
    public string UserName { get; set; }
    public string Phone { get; set; }
    public string Address { get; set; }

    // Navigation properties
    public IList<Role> Roles { get; set; }
    public IList<UserRefreshToken> RefreshTokens { get; set; }
    public IList<Order> Orders { get; set; }
    public IList<ProductHistory> ProductHistories { get; set; }
}