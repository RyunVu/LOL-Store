using LoLStore.Core.Contracts;


namespace LoLStore.Core.Entities;

public class Discount : IEntity
{
     public Guid Id { get; set; }
    
    // Required fields
    public string Code { get; set; } = string.Empty;
    public decimal DiscountValue { get; set; }
    public bool IsPercentage { get; set; }
    
    // Optional fields - nullable 
    public decimal? MinimunOrderAmount { get; set; }
    public int? MaxUses { get; set; }
    
    public int TimesUsed { get; set; }
    
    // Dates with defaults
    public DateTime StartDate { get; set; } = DateTime.UtcNow;
    public DateTime EndDate { get; set; }
    
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

}