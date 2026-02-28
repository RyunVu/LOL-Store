using LoLStore.Core.Constants;

namespace LoLStore.WebAPI.Models.OrderModel;

public class OrderEditModel
{
	public string Name { get; set; } = string.Empty;
	public string Email { get; set; } = string.Empty;
	public string ShipAddress { get; set; } = string.Empty;
	public string Phone { get; set; }  = string.Empty;
	public string? Note { get; set; }
	public string? DiscountCode { get; set; }
	public IList<OrderDetailEdit> Detail { get; set; } = new List<OrderDetailEdit>();
}
