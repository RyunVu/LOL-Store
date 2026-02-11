using LoLStore.Core.Constants;
using LoLStore.Core.Entities;
using LoLStore.Core.Queries;

namespace LoLStore.Services.Shop.Orders;

public interface IOrderRepository
{
    // ===== Queries (READ) =====

    Task<Order?> GetByIdAsync(Guid id, CancellationToken ct = default);

    Task<Order?> GetActiveByIdAsync(Guid id, CancellationToken ct = default);

    Task<Order?> GetByCodeAsync(string code, CancellationToken ct = default);

    Task<IPagedList<T>> GetPagedOrdersAsync<T>(
        OrderQuery query,
        IPagingParams pagingParams,
        Func<IQueryable<Order>, IQueryable<T>> mapper,
        CancellationToken ct = default);

    Task<IPagedList<T>> GetPagedOrdersByUserAsync<T>(
        Guid userId,
        OrderQuery query,
        IPagingParams pagingParams,
        Func<IQueryable<Order>, IQueryable<T>> mapper,
        CancellationToken ct = default);

    Task<Order?> GetByIdWithDetailsAsync(Guid id, CancellationToken ct = default);

    Task<OrderDetail?> GetOrderDetailsAsync(Guid id, CancellationToken ct = default);

    // ===== Write (COMMAND) =====

    Task AddAsync(Order order, CancellationToken ct = default);

    Task SaveChangesAsync(CancellationToken ct = default);

    Task<bool> DeletePermanentlyAsync(Guid id, CancellationToken ct = default);

    // ===== Validation Helpers =====

    Task<bool> ExistsByCodeAsync(string code, Guid? excludeId, CancellationToken ct = default);

    Task<bool> HasSufficientStockAsync(Guid productId, int quantity, CancellationToken ct = default);

    Task<decimal?> GetProductPriceAsync(Guid productId, CancellationToken ct = default);

    Task<Discount?> GetValidDiscountAsync(string code, decimal orderTotal, CancellationToken ct = default);

    // Build a temporary Order from provided details (used for discount validation)
    Task<Order> GetProductOrderAsync(IList<OrderDetailEdit> details, CancellationToken ct = default);
}
