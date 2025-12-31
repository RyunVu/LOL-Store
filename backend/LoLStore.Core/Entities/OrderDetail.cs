using System.ComponentModel.DataAnnotations.Schema;

namespace LoLStore.Core.Entities;

public class OrderDetail
{
    public Guid OrderId { get; set; }
    public Guid ProductId { get; set; }
    public decimal Price { get; set; }
    public int Quantity { get; set; }

    [NotMapped]
    public decimal TotalPrice => Math.Round(Price * Quantity, 2);
    
    // Navigation properties
    public Order Order { get; set; } = null!;
    public Product Product { get; set; } = null!;
}