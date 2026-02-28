namespace LoLStore.Core.DTO.Orders;

public class UpdateOrderDto
{    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string ShipAddress { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string? Note { get; set; }    
    public string? DiscountCode { get; set; }
    public IList<OrderItemDto> Items { get; set; } = new List<OrderItemDto>();
}