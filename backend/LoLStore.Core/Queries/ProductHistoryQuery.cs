using LoLStore.Core.Entities;

namespace LoLStore.Core.Queries;

public class ProductHistoryQuery
{
    public Guid? ProductId { get; set; } 
    public string? Keyword { get; set; } 
    public Guid? UserId { get; set; } 
    public int? Year { get; set; }
    public int? Month { get; set; }
    public int? Day { get; set; }
    public ProductHistoryAction? Action { get; set; }
}