using LoLStore.Core.Entities;

namespace LoLStore.API.Models.ProductHistoryModel;

public class ProductHistoryDto{
    public Guid Id { get; set; }

	public Guid ProductId { get; set; }

	public Guid UserId { get; set; }

	public string ProductName { get; set; } = string.Empty;

	public string UserName { get; set; } = string.Empty;

	public DateTime ActionTime { get; set; }

	public ProductHistoryAction HistoryAction { get; set; }

	public string? Note { get; set; }
}