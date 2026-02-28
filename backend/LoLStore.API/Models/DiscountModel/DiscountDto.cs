using LoLStore.Core.Constants;

namespace LoLStore.API.Models.DiscountModel;

public class DiscountDto
{
    public Guid Id { get; set; }
    public string Code { get; set; } = string.Empty;

    public decimal DiscountValue { get; set; }
    public bool IsPercentage { get; set; }

    public decimal? MinimumOrderAmount { get; set; }
    public int? MaxUses { get; set; }
    public int TimesUsed { get; set; }

    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }

    public bool IsActive { get; set; }
    public DiscountStatus Status { get; set; }
    public int OrderCount { get; set; }
}