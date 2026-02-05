using LoLStore.Core.Constants;

namespace LoLStore.Core.Queries;

public class DiscountQuery
{
    public string? Code { get; set; }

    // Value filters
    public decimal? DiscountValue { get; set; }
    public bool? IsPercentage { get; set; }

    // Order conditions
    public decimal? MinimunOrderAmount { get; set; }
    public int? RemainingUses { get; set; }

    // Status
    public bool? IsActive { get; set; }
    public bool? ValidNow { get; set; }

    // Date filters
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }

    // Created date breakdown (admin analytics)
    public int? Year { get; set; }
    public int? Month { get; set; }
    public int? Day { get; set; }
    
    public bool? IsDeleted { get; set; }
    public DiscountStatus? Status { get; set; }
    public DateFilterType? DateFilter { get; set; }    
    public SortOrder SortOrder { get; set; } = SortOrder.Desc;
}
