using LoLStore.Core.Constants;
using LoLStore.Core.Entities;
using LoLStore.Core.Queries;
using LoLStore.Data.Contexts;
using LoLStore.Services.Extensions;
using Microsoft.EntityFrameworkCore;

namespace LoLStore.Services.Shop;

public class OrderRepository : IOrderRepository
{
    private readonly StoreDbContext _context;

    public OrderRepository(StoreDbContext context)
    {
        _context = context;
    }

    public async Task<Order> AddOrderAsync(Order order, User user, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(order);
        ArgumentNullException.ThrowIfNull(user);

        order.UserId = user.Id;
        order.Email = user.Email;
        order.Status = OrderStatus.New;
        order.OrderDate = DateTime.UtcNow;

        var code = Guid.NewGuid().ToString("N")[..10].ToUpper();
        order.CodeOrder = $"HD{code}";

        _context.Orders.Add(order);
        await _context.SaveChangesAsync(cancellationToken);
        return order;
    }

    public async Task<Order> AddProductOrderAsync(
        Guid orderId,
        IList<OrderDetailEdit> items,
        CancellationToken ct = default)
    {
        using var tx = await _context.Database.BeginTransactionAsync(ct);

        var order = await _context.Orders
            .Include(o => o.OrderItems)
            .FirstOrDefaultAsync(o => o.Id == orderId, ct)
            ?? throw new InvalidOperationException("Order not found");

        var productIds = items.Select(i => i.Id).ToList();

        var products = await _context.Products
            .Where(p => productIds.Contains(p.Id) && p.Active)
            .ToListAsync(ct);

        foreach (var item in items)
        {
            var product = products.FirstOrDefault(p => p.Id == item.Id)
                ?? throw new InvalidOperationException("Product not found");

            if (product.Quantity < item.Quantity)
                throw new InvalidOperationException("Insufficient stock");

            product.Quantity -= item.Quantity;
            product.CountOrder += item.Quantity;

            order.OrderItems.Add(new OrderDetail
            {
                OrderId = order.Id,
                ProductId = product.Id,
                Price = product.Price,
                Quantity = item.Quantity
            });
        }

        await _context.SaveChangesAsync(ct);
        await tx.CommitAsync(ct);

        return order;
    }    
    
    public async Task<bool> AddDiscountOrderAsync(
        Order order,
        string discountCode,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(order);

        if (order.IsDiscountApplied)
            throw new InvalidOperationException("Discount already applied.");

        if (string.IsNullOrWhiteSpace(discountCode))
            throw new ArgumentException("Discount code is required.");

        var total = order.OrderItems.Sum(i => i.Price * i.Quantity);

        var discount = await CheckValidDiscountAsync(
            discountCode,
            total,
            cancellationToken);

        if (discount == null)
            return false;

        decimal discountAmount;

        if (discount.IsPercentage)
        {
            discountAmount = total * discount.DiscountValue / 100m;
        }
        else
        {
            discountAmount = discount.DiscountValue;
        }

        discountAmount = Math.Min(discountAmount, total);

        order.Discount = discount;
        order.DiscountAmount = discountAmount;
        order.IsDiscountApplied = true;

        discount.TimesUsed++;

        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }
    
    public async Task<Discount> CheckValidDiscountAsync(
        string discountCode,
        decimal totalBill,
        CancellationToken ct = default)
    {
        var discount = await _context.Discounts.FirstOrDefaultAsync(d =>
            d.Code == discountCode &&
            d.IsActive &&
            d.StartDate <= DateTime.UtcNow &&
            d.EndDate >= DateTime.UtcNow,
            ct);

        if (discount == null)
            throw new InvalidOperationException("Invalid discount code");

        if (discount.MaxUses.HasValue &&
            discount.TimesUsed >= discount.MaxUses.Value)
            throw new InvalidOperationException("Discount usage limit reached");

        if (discount.MinimunOrderAmount.HasValue &&
            totalBill < discount.MinimunOrderAmount.Value)
            throw new InvalidOperationException("Order does not meet minimum amount");

        return discount;
    }

    public async Task<Order> CancelOrderAsync(Guid orderId, CancellationToken ct = default)
    {
        using var tx = await _context.Database.BeginTransactionAsync(ct);

        var order = await _context.Orders
            .Include(o => o.OrderItems)
            .FirstOrDefaultAsync(o => o.Id == orderId, ct)
            ?? throw new InvalidOperationException("Order not found");

        if (order.Status == OrderStatus.Cancelled)
            return order;

        order.Status = OrderStatus.Cancelled;

        foreach (var detail in order.OrderItems)
        {
            var product = await _context.Products
                .FirstOrDefaultAsync(p => p.Id == detail.ProductId, ct);

            if (product != null)
            {
                product.Quantity += detail.Quantity;
                product.CountOrder -= detail.Quantity;
            }
        }

        await _context.SaveChangesAsync(ct);
        await tx.CommitAsync(ct);

        return order;
    }

    public async Task<bool> CheckQuantityProductAsync(
        Guid productId,
        int quantity,
        CancellationToken ct = default)
    {
        return await _context.Products
            .AnyAsync(p => p.Id == productId && p.Active && p.Quantity >= quantity, ct);
    }

    public async Task<Order> GetOrderByIdAsync(Guid id, CancellationToken ct = default)
    {
        return await _context.Orders
            .Include(o => o.OrderItems)
            .ThenInclude(d => d.Product)
            .Include(o => o.Discount)
            .FirstOrDefaultAsync(o => o.Id == id, ct)
            ?? throw new InvalidOperationException("Order not found");
    }

    public async Task<Order> GetOrderByCodeAsync(string code, CancellationToken ct = default)
    {
        return await _context.Orders
            .Include(o => o.OrderItems)
            .ThenInclude(d => d.Product)
            .ThenInclude(p => p.Pictures)
            .Include(o => o.Discount)
            .FirstOrDefaultAsync(o => o.CodeOrder == code, ct)
            ?? throw new InvalidOperationException("Order not found");
    }

    public async Task<IPagedList<T>> GetPagedOrdersAsync<T>(
        OrderQuery query,
        IPagingParams paging,
        Func<IQueryable<Order>, IQueryable<T>> mapper)
    {
        var orders = FilterOrder(query);
        return await mapper(orders).ToPagedListAsync(paging);
    }

    public async Task<IPagedList<T>> GetPagedOrdersByUserAsync<T>(
        Guid userId,
        OrderQuery query,
        IPagingParams paging,
        Func<IQueryable<Order>, IQueryable<T>> mapper)
    {
        var orders = FilterOrder(query, userId);
        var projectedOrders = mapper(orders);

        return await projectedOrders.ToPagedListAsync(paging);
    }

    public async Task<Order> GetProductOrderAsync(IList<OrderDetailEdit> details, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(details);

        var order = new Order();

        foreach (var item in details)
        {
            var product = await _context.Products
                .FirstOrDefaultAsync(p => p.Id == item.Id, cancellationToken)
                ?? throw new InvalidOperationException("Product not found");

            order.OrderItems.Add(new OrderDetail
            {
                ProductId = product.Id,
                Price = product.Price,
                Quantity = item.Quantity
            });
        }

        return order;
    }

    public async Task<Order> ToggleOrderAsync(Order order, OrderStatus status, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(order);

        if (order.Status == status)
            return order;

        order.Status = status;

        _context.Entry(order).State = EntityState.Modified;
        await _context.SaveChangesAsync(cancellationToken);

        return order;
    }

    public async Task<IPagedList<T>> GetPagedOrderAsync<T>(OrderQuery query, IPagingParams pagingParams, Func<IQueryable<Order>, IQueryable<T>> mapper, CancellationToken cancellationToken = default)
    {
        var orders = FilterOrder(query);
        var projectedOrders = mapper(orders);
        
		return await projectedOrders.ToPagedListAsync(pagingParams);
    }    

    private IQueryable<Order> FilterOrder(OrderQuery query, Guid userId = default)
	{
		var orders = _context.Set<Order>()
			.Include(s => s.OrderItems)
			.Include(s => s.Discount)
			.WhereIf(userId != Guid.Empty, s => s.UserId == userId)
			.WhereIf(query.Status != null && query.Status != OrderStatus.None, o => o.Status == query.Status)
			.WhereIf(query.Year > 0, s => s.OrderDate.Year == query.Year)
			.WhereIf(query.Month > 0, s => s.OrderDate.Month == query.Month)
			.WhereIf(query.Day > 0, s => s.OrderDate.Day == query.Day)
			.WhereIf(!string.IsNullOrWhiteSpace(query.Keyword), s =>
				s.Name != null && s.Name.Contains(query.Keyword!) ||
                s.Email != null && s.Email.Contains(query.Keyword!) ||
                s.Phone != null && s.Phone.Contains(query.Keyword!) ||
                s.ShipAddress != null && s.ShipAddress.Contains(query.Keyword!));
		return orders;

	}
}
