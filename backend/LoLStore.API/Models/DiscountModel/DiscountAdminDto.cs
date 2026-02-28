namespace LoLStore.API.Models.DiscountModel;

public class DiscountAdminDto: DiscountDto
{
    public bool IsDeleted { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public DateTime? DeletedAt { get; set; }
}