using LoLStore.Core.Contracts;


namespace LoLStore.Core.Entities;

public class Discount : IEntity
{
    public Guid Id { get; set; }
	public string Code { get; set; }
	public float DiscountValue { get; set; }
	public bool IsPercentage { get; set; }
	public int? MinimunOrderAmount  { get; set; }
    public int? MaxUses { get; set; }
    public int TimesUsed { get; set; }
    public DateTime StartDate { get; set; } = DateTime.UtcNow;
	public DateTime EndDate { get; set; }
	public bool IsActive { get; set; }
	public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

}