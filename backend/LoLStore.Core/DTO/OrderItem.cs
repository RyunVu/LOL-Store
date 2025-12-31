using LoLStore.Core.Entities;

namespace LoLStore.Core.DTO;

public class OrderItem
{
    public Guid Id { get; set; }

	public DateTime OrderDate { get; set; }

	public string CodeOrder { get; set; } = string.Empty;

	public Guid UserId { get; set; }

	public OrderStatus Status { get; set; }

	public string Name { get; set; } = string.Empty;

	public string Email { get; set; } = string.Empty;

	public string ShipAddress { get; set; } = string.Empty;

	public string Phone { get; set; } = string.Empty;

	public string? Note { get; set; }

	public decimal DiscountAmount { get; set; }

	public bool IsDiscountApplied { get; set; }

	public decimal Total { get; set; } 
	public IList<Constants.OrderDetailEdit> Details { get; set; } = new List<Constants.OrderDetailEdit>();

}

public class OrderItemDetail
{
    public Guid Id;
    public decimal Price;
    public int Quantity;
}