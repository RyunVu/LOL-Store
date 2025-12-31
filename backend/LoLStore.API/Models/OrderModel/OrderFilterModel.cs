using LoLStore.API.Models;
using LoLStore.Core.Entities;

namespace LoLStore.WebAPI.Models.OrderModel;

public class OrderFilterModel : PagingModel
{
	public int? Year { get; set; } = 0;

	public int? Month { get; set; } = 0;

	public int? Day { get; set; } = 0;

	public OrderStatus? Status { get; set; } = OrderStatus.None;

	public string? Keyword { get; set; }
}