namespace LoLStore.Core.DTO.Discounts;

public class CreateDiscountDto
{
    // Core
    public string Code { get; set; } = string.Empty;
    public decimal DiscountValue { get; set; }
    public bool IsPercentage { get; set; }
    
    // Conditions
    public decimal? MinimunOrderAmount { get; set; }
    public int? MaxUses { get; set; }
    
    // Validity
    public DateTime StartDate { get; set; } = DateTime.UtcNow;
    public DateTime EndDate { get; set; }
    
    // State
    public bool IsActive { get; set; }
}