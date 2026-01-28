using LoLStore.API.Models;

namespace LoLStore.WebAPI.Models.DiscountModel;

public class DiscountFilterModel : PagingModel
{
    // Text search
    public string? Code { get; set; }

    // Discount logic
    public decimal? DiscountValue { get; set; }
    public bool? IsPercentage { get; set; }

    // Order constraints
    public decimal? MinimunOrderAmount { get; set; }

    // Business state (not raw DB flag)
    public bool? IsActive { get; set; }

    // Validity window
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }

    // Created date filtering (admin)
    public int? Year { get; set; }
    public int? Month { get; set; }
    public int? Day { get; set; }
}
