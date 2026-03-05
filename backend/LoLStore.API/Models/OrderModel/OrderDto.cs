using LoLStore.API.Models.DiscountModel;
using LoLStore.Core.Entities;

namespace LoLStore.API.Models.OrderModel;

public class OrderDto
{
    public Guid Id { get; set; }

	public string CodeOrder { get; set; } = string.Empty;

	public DateTime OrderDate { get; set; }

	public OrderStatus Status { get; set; }

	public string Name { get; set; } = string.Empty;

	public string Email { get; set; } = string.Empty;

	public string ShipAddress { get; set; } = string.Empty;

	public string Phone { get; set; } = string.Empty;

	public string? Note { get; set; }

	public decimal DiscountAmount { get; set; }

    public decimal TotalAmount  { get; set; }

    public string? TransactionId { get; set; }

    public string? PaymentMethod { get; set; }
	
    public DateTime? PaidAt { get; set; }

    public DiscountDto? Discount { get; set; }

	public IList<OrderDetailDto> OrderItems { get; set; } = new List<OrderDetailDto>();
}

public class OrderDetailDto
{
	public Guid OrderId { get; set; }

	public Guid ProductId { get; set; }

	public int Quantity { get; set; }

	public decimal Price { get; set; }

	public string Name { get; set; } = string.Empty;

	public string Sku { get; set; } = string.Empty;

	public string UrlSlug { get; set; } = string.Empty;

	public string ImageUrl { get; set; } = string.Empty;
}