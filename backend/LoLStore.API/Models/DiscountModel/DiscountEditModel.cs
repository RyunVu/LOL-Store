namespace LoLStore.WebAPI.Models.DiscountModel;

public class DiscountEditModel
{
	public string Code { get; set; } = string.Empty;

    public decimal DiscountValue { get; set; }
    public bool IsPercentage { get; set; }

    public int? MinimunOrderAmount { get; set; }
    public int? MaxUses { get; set; }

    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }

    public bool IsActive { get; set; }
}