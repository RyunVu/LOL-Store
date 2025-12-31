using LoLStore.Core.Constants;
using LoLStore.Core.Entities;
using LoLStore.Core.Queries;

namespace LoLStore.Services.Shop;

public interface IOrderRepository
{
    Task<Order> AddOrderAsync(Order order, User user, CancellationToken cancellationToken = default);
    Task<bool> AddDiscountOrderAsync(Order order, string discountCode, CancellationToken cancellationToken = default);
    Task<Discount> CheckValidDiscountAsync(string discountCode, decimal totalBill, CancellationToken cancellationToken = default);
    Task<Order> AddProductOrderAsync(Guid orderId, IList<Core.Constants.OrderDetailEdit> details, CancellationToken cancellationToken = default);
    Task<Order> GetProductOrderAsync(IList<Core.Constants.OrderDetailEdit> details, CancellationToken cancellationToken = default);
    Task<bool> CheckQuantityProductAsync(Guid productId, int quantity, CancellationToken cancellationToken = default);
    Task<Order> GetOrderByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<Order> GetOrderByCodeAsync(string code, CancellationToken cancellationToken = default);
    Task<Order> ToggleOrderAsync(Order order, OrderStatus status, CancellationToken cancellationToken = default);
    Task<IPagedList<T>> GetPagedOrderAsync<T>(OrderQuery query, IPagingParams pagingParams, Func<IQueryable<Order>, IQueryable<T>> mapper, CancellationToken cancellationToken = default);
    Task<IPagedList<T>> GetPagedOrdersByUserAsync<T>(Guid userId, OrderQuery condition, IPagingParams pagingParams, Func<IQueryable<Order>, IQueryable<T>> mapper);
	Task<Order> CancelOrderAsync(Guid orderId, CancellationToken cancellation = default);
}