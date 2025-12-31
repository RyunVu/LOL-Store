namespace LoLStore.Core.Queries;

public class DiscountQuery
{
    public int? Quantity { get; set; }
    public decimal? MinPrice { get; set; }
    public decimal? DiscountPercent { get; set; }
    public int? Year { get; set; }
    public int? Month { get; set; }
    public int? Day { get; set; }
    public DateTime? StartDate { get; set; } 
    public DateTime? EndDate { get; set; }
    public decimal? DiscountValue { get; set; }
    public bool? IsPercentage { get; set; }
}