using LoLStore.Core.Constants;

namespace LoLStore.WebAPI.Models.DiscountModel;

public class DiscountOrdersModel
{
	public string DiscountCode { get; set; } = string.Empty;

	public IList<OrderDetailEdit> Detail { get; set; } = new List<OrderDetailEdit>();
}