namespace LoLStore.Core.DTO.Orders;

public class CreateOrderDto
{
    public string Name { get; set; } = string.Empty;

    public string Email { get; set; } = string.Empty;

    public string ShipAddress { get; set; } = string.Empty;

    public string Phone { get; set; } = string.Empty;

    public string? Note { get; set; }

    public List<OrderItemDto> Items { get; set; } = new();

    public string? DiscountCode { get; set; }
}