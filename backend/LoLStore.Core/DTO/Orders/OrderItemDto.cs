namespace LoLStore.Core.DTO.Orders;

public class OrderItemDto
{
    public Guid ProductId { get; set; }
    public int Quantity { get; set; }
}