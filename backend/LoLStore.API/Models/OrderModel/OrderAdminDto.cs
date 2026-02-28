namespace LoLStore.API.Models.OrderModel;

public class OrderAdminDto : OrderDto
{
    public bool IsDeleted { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public DateTime? DeletedAt { get; set; }
}
