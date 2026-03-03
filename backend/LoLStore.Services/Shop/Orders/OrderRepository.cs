using LoLStore.Core.Constants;
using LoLStore.Core.Entities;
using LoLStore.Core.Queries;
using LoLStore.Data.Contexts;
using LoLStore.Services.Extensions;
using Microsoft.EntityFrameworkCore;

namespace LoLStore.Services.Shop.Orders;

public class OrderRepository : IOrderRepository
{
    private readonly StoreDbContext _context;

    public OrderRepository(StoreDbContext context)
    {
        _context = context;
    }

    // =======================
    // Queries (READ)
    // =======================

    public async Task<Order?> GetByIdAsync(
        Guid id,
        CancellationToken ct = default)
    {
        return await _context.Orders
            .FirstOrDefaultAsync(o => o.Id == id, ct);
    }

    public async Task<Order?> GetActiveByIdAsync(
        Guid id,
        CancellationToken ct = default)
    {
        return await _context.Orders
            .AsNoTracking()
            .FirstOrDefaultAsync(
                o => o.Id == id && !o.IsDeleted,
                ct);
    }

    public async Task<Order?> GetByCodeAsync(
        string code,
        CancellationToken ct = default)
    {
        return await _context.Orders
            .Include(o => o.OrderItems)
            .ThenInclude(od => od.Product)
            .Include(o => o.Discount)
            .Include(o => o.User)
            .FirstOrDefaultAsync(
                o => o.CodeOrder == code,
                ct);
    }

    public async Task<Order?> GetByIdWithDetailsAsync(
        Guid id,
        CancellationToken ct = default)
    {
        return await _context.Orders
            .Include(o => o.OrderItems)
            .ThenInclude(od => od.Product)
            .Include(o => o.Discount)
            .Include(o => o.User)
            .FirstOrDefaultAsync(o => o.Id == id, ct);
    }

    public async Task<IPagedList<T>> GetPagedOrdersAsync<T>(
        OrderQuery query,
        IPagingParams pagingParams,
        Func<IQueryable<Order>, IQueryable<T>> mapper,
        CancellationToken ct = default)
    {
        var orders = FilterOrders(query);

        return await mapper(orders)
            .ToPagedListAsync(pagingParams, ct);
    }

    public async Task<IPagedList<T>> GetPagedOrdersByUserAsync<T>(
        Guid userId,
        OrderQuery query,
        IPagingParams pagingParams,
        Func<IQueryable<Order>, IQueryable<T>> mapper,
        CancellationToken ct = default)
    {
        var orders = _context.Orders
            .AsNoTracking()
            .Where(o => o.UserId == userId);

        if (!query.Status.HasValue || query.Status != OrderStatus.Cancelled)
        {
            var cutoff = DateTime.UtcNow.AddDays(-30);
            orders = orders.Where(o =>
                o.Status != OrderStatus.Cancelled ||
                o.OrderDate >= cutoff);
        }

        // Apply remaining filters
        if (query.Status.HasValue)
            orders = orders.Where(o => o.Status == query.Status);

        if (!string.IsNullOrWhiteSpace(query.Keyword))
            orders = orders.Where(o =>
                o.CodeOrder.Contains(query.Keyword) ||
                o.Name.Contains(query.Keyword) ||
                o.Email.Contains(query.Keyword));

        if (query.Year.HasValue)
            orders = orders.Where(o => o.OrderDate.Year == query.Year);

        if (query.Month.HasValue)
            orders = orders.Where(o => o.OrderDate.Month == query.Month);

        return await mapper(orders.OrderByDescending(o => o.OrderDate))
            .ToPagedListAsync(pagingParams, ct);
    }

    public async Task<OrderDetail?> GetOrderDetailsAsync(Guid id, CancellationToken ct = default){
        return await _context.OrderItems
            .AsNoTracking()
            .FirstOrDefaultAsync(od => od.OrderId == id, ct);
    }

    // =======================
    // Writes (COMMAND)
    // =======================

    public async Task AddAsync(
        Order order,
        CancellationToken ct = default)
    {
        await _context.Orders.AddAsync(order, ct);
        await _context.SaveChangesAsync(ct);
    }

    public async Task SaveChangesAsync(CancellationToken ct = default)
    {
        await _context.SaveChangesAsync(ct);
    }

    public async Task<bool> DeletePermanentlyAsync(
        Guid id,
        CancellationToken ct = default)
    {
        return await _context.Orders
            .Where(o => o.Id == id)
            .ExecuteDeleteAsync(ct) > 0;
    }

    // =======================
    // Validation Helpers
    // =======================

    public async Task<bool> ExistsByCodeAsync(
        string code,
        Guid? excludeId,
        CancellationToken ct = default)
    {
        return await _context.Orders.AnyAsync(
            o => o.CodeOrder == code &&
                 (!excludeId.HasValue || o.Id != excludeId),
            ct);
    }

    public async Task<bool> HasSufficientStockAsync(
        Guid productId,
        int quantity,
        CancellationToken ct = default)
    {
        var product = await _context.Products
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.Id == productId, ct);

        return product != null && product.Quantity >= quantity;
    }

    public async Task<decimal?> GetProductPriceAsync(
        Guid productId,
        CancellationToken ct = default)
    {
        return await _context.Products
            .AsNoTracking()
            .Where(p => p.Id == productId && !p.IsDeleted && p.IsActive)
            .Select(p => p.Price)
            .FirstOrDefaultAsync(ct);
    }

    public async Task<Discount?> GetValidDiscountAsync(
        string code,
        decimal orderTotal,
        CancellationToken ct = default)
    {
        var now = DateTime.UtcNow;

        return await _context.Discounts
            .AsNoTracking()
            .FirstOrDefaultAsync(
                d => d.Code == code &&
                     d.IsActive &&
                     !d.IsDeleted &&
                     d.StartDate <= now &&
                     d.EndDate >= now &&
                     (d.MinimumOrderAmount == null || d.MinimumOrderAmount <= orderTotal) &&
                     (d.MaxUses == null || d.TimesUsed < d.MaxUses),
                ct);
    }

    public async Task<Order> GetProductOrderAsync(
        IList<OrderDetailEdit> details,
        CancellationToken ct = default)
    {
        var order = new Order();

        foreach (var d in details)
        {
            if (d == null) continue;

            var productId = d.Id;
            var qty = d.Quantity ?? 1;

            var price = await GetProductPriceAsync(productId, ct) ?? 0m;

            var od = new OrderDetail
            {
                ProductId = productId,
                Quantity = qty,
                Price = price
            };

            order.OrderItems.Add(od);
        }

        order.TotalAmount = Math.Round(order.OrderItems.Sum(i => i.Price * i.Quantity), 2);

        return order;
    }

    // =======================
    // Filter Helpers
    // =======================

    private IQueryable<Order> FilterOrders(OrderQuery query)
    {
        var orders = _context.Orders.AsQueryable();

        if (query.Status.HasValue)
        {
            // Special handling: Cancelled status means show deleted orders only
            if (query.Status == OrderStatus.Cancelled)
            {
                orders = orders.Where(o => o.IsDeleted);
            }
            else
            {
                orders = orders.Where(o => o.Status == query.Status);
            }
        }

        if (!string.IsNullOrWhiteSpace(query.Keyword))
        {
            orders = orders.Where(o =>
                o.CodeOrder.Contains(query.Keyword) ||
                o.Name.Contains(query.Keyword) ||
                o.Email.Contains(query.Keyword));
        }

        // Date filtering
        if (query.Year.HasValue)
        {
            orders = orders.Where(o => o.OrderDate.Year == query.Year);
        }

        if (query.Month.HasValue)
        {
            orders = orders.Where(o => o.OrderDate.Month == query.Month);
        }

        if (query.Day.HasValue)
        {
            orders = orders.Where(o => o.OrderDate.Day == query.Day);
        }

        return orders.AsNoTracking();
    }
}
