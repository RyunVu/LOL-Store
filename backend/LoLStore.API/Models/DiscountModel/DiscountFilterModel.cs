using LoLStore.API.Models;
using LoLStore.Core.Constants;

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

    public bool? IsActive { get; set; }
    public bool? ValidNow { get; set; }

    // Validity window
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }

}

public class DiscountManagerFilterModel : DiscountFilterModel
{
    public bool? IsDeleted { get; set; }
    public DiscountStatus? Status { get; set; }
    public DateFilterType? DateFilter { get; set; }
}