namespace LoLStore.Core.DTO;

public enum TypeRevenue
{
	Year,
	Month, 
	Day, 
	Hour
}

public class RevenueOrderDto
{
    public DateTime Period { get; set; }

    public decimal TotalRevenue { get; set; }

    public int TotalOrder { get; set; }

    public TypeRevenue TypeRevenue { get; set; }
}