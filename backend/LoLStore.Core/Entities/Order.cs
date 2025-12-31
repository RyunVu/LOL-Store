using System.ComponentModel.DataAnnotations.Schema;
using LoLStore.Core.Contracts;

namespace LoLStore.Core.Entities;

public enum OrderStatus
{
    None,
    New,
    Pending,
    Processing,
    Shipped,
    Delivered,
    Cancelled
}

public class Order : IEntity
{
    public Guid Id { get; set; }
    public DateTime OrderDate { get; set; } = DateTime.UtcNow;
    
    // Required fields
    public string CodeOrder { get; set; } = string.Empty;
    public Guid UserId { get; set; }
    public OrderStatus Status { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string ShipAddress { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    
    // Optional fields
    public string? Note { get; set; }
    
    public decimal DiscountAmount { get; set; }
    public bool IsDiscountApplied { get; set; }
    public decimal TotalAmount { get; set; }

    // Navigation properties
    public User User { get; set; } = null!;
    public Discount? Discount { get; set; }  // Nullable vì có thể không có discount
    public IList<OrderDetail> OrderItems { get; set; } = new List<OrderDetail>();
}
