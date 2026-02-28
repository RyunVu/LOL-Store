using LoLStore.Core.Contracts;

namespace LoLStore.Core.Entities;

public enum ProductHistoryAction
{
    None,
    Create,
    Delete,
    Restore,
    Update
}

public class ProductHistory : IEntity
{    
    public Guid Id { get; set; }
    public Guid ProductId { get; set; }
    public Guid UserId { get; set; }
    public DateTime ActionTime { get; set; } = DateTime.UtcNow;
    public ProductHistoryAction HistoryAction { get; set; }
    
    public string EditReason { get; set; } = string.Empty;

    // Navigation properties
    public User User { get; set; } = null!;
    public Product Product { get; set; } = null!;
}