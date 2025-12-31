using LoLStore.API.Models;

namespace LoLStore.WebAPI.Models.DiscountModel;

public class DiscountFilterModel : PagingModel
{
    public string? Code { get; set; }

    public decimal? DiscountValue { get; set; }
    public bool? IsPercentage { get; set; }

    public int? MinimunOrderAmount { get; set; }
    public bool? IsActive { get; set; }

    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }

    public int? Year { get; set; }
    public int? Month { get; set; }
    public int? Day { get; set; }
}