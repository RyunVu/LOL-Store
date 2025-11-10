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
    public DateTime OrderDate { get; set; }
    public string CodeOrder { get; set; }
    public Guid UserId { get; set; }
    public OrderStatus Status { get; set; }
    public string Name { get; set; }
    public string Email { get; set; }
    public string ShipAddress { get; set; }
    public string Phone { get; set; }
    public string Note { get; set; }
    public float DiscountAmount { get; set; }
    public bool IsDiscountApplied { get; set; }

    [NotMapped]
    public double TotalAmount { get; set; }

    // Navigation properties
    public User User { get; set; }
    public Discount Discount { get; set; }
    public IList<OrderItem> OrderItems { get; set; }
}