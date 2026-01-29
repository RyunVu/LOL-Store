using LoLStore.Core.Constants;
using LoLStore.Core.Contracts;


namespace LoLStore.Core.Entities;

public class Discount : BaseEntity
{
    // Core
    public string Code { get; set; } = string.Empty;
    public DiscountStatus Status { get; set; }
    public decimal DiscountValue { get; set; }
    public bool IsPercentage { get; set; }
    
    // Conditions
    public decimal? MinimunOrderAmount { get; set; }
    public int? MaxUses { get; set; }
    public int TimesUsed { get; set; }
    
    // Validity
    public DateTime StartDate { get; set; } = DateTime.UtcNow;
    public DateTime EndDate { get; set; }
    
    // State
    public bool IsActive { get; set; }

    public ICollection<Order>? Orders { get; set; }
}