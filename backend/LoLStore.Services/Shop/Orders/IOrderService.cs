using LoLStore.Core.DTO.Orders;
using LoLStore.Core.Entities;

namespace LoLStore.Services.Shop.Orders;

public interface IOrderService
{
    Task<Guid> CreateAsync(Guid userId, CreateOrderDto dto, CancellationToken cancellationToken = default);
    Task UpdateAsync(UpdateOrderDto dto, CancellationToken cancellationToken = default);
    Task<Order?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task ChangeStatusAsync(Guid orderId, OrderStatus newStatus, CancellationToken cancellationToken = default);
    Task CancelAsync(Guid orderId, CancellationToken cancellationToken = default);
    Task DeletePermanentlyAsync(Guid orderId, CancellationToken cancellationToken = default);
    Task ApplyDiscountAsync(Guid orderId, string discountCode, CancellationToken cancellationToken = default);
    
    Task<bool> MarkOrderAsPaidAsync(Guid orderId, string transactionId, CancellationToken ct = default);
}
