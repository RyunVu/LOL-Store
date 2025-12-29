using LoLStore.Core.Entities;

namespace LoLStore.API.Models.ProductHistoryModel;

public class ProductHistoryFilterModel : PagingModel
{
    public string? Keyword { get; set; } 
    public Guid? ProductId { get; set; }
    public Guid? UserId { get; set; }
    public int? Day { get; set; }
    public int? Month { get; set; }
    public int? Year { get; set; }
    public DateTime? FromDate { get; set; }
    public DateTime? ToDate { get; set; }
    public ProductHistoryAction? Action { get; set; }

}