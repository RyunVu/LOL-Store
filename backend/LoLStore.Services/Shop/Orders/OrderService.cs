using LoLStore.Core.DTO.Orders;
using LoLStore.Core.Entities;
using LoLStore.Data.Contexts;
using LoLStore.Services.Extensions;
using Microsoft.EntityFrameworkCore;

namespace LoLStore.Services.Shop.Orders;

public class OrderService : IOrderService
{
    private readonly IOrderRepository _orderRepository;
    private readonly StoreDbContext _context;

    public OrderService(IOrderRepository orderRepository, StoreDbContext context)
    {
        _orderRepository = orderRepository;
        _context = context;
    }

     public async Task<Guid> CreateAsync(
        Guid userId,
        CreateOrderDto dto,
        CancellationToken cancellationToken = default)
    {
        // ── 1. Basic validation ──────────────────────────────────
        if (dto.Items == null || dto.Items.Count == 0)
            throw new InvalidOperationException("Order must contain at least one item.");

        // ── 2. Validate every item: stock + price ────────────────
        foreach (var item in dto.Items)
        {
            if (item.Quantity <= 0)
                throw new InvalidOperationException(
                    "Product quantity must be greater than 0.");

            if (!await _orderRepository.HasSufficientStockAsync(
                    item.ProductId, item.Quantity, cancellationToken))
                throw new InvalidOperationException(
                    "Insufficient stock for one or more products.");

            var price = await _orderRepository.GetProductPriceAsync(
                item.ProductId, cancellationToken);

            if (price == null)
                throw new KeyNotFoundException(
                    $"Product '{item.ProductId}' was not found or is inactive.");
        }

        // ── 3. Generate a unique order code ──────────────────────
        var orderCode = await GenerateUniqueOrderCodeAsync(cancellationToken);

        // ── 4. Build order header ────────────────────────────────
        var order = new Order
        {
            UserId           = userId,
            CodeOrder        = orderCode,
            Name             = dto.Name,
            Email            = dto.Email,
            ShipAddress      = dto.ShipAddress,
            Phone            = dto.Phone,
            Note             = dto.Note,
            OrderDate        = DateTime.UtcNow,
            Status           = OrderStatus.New,
            IsDiscountApplied = false,
            DiscountAmount   = 0,
            TotalAmount      = 0
        };

        // ── 5. Build order items + compute subtotal ──────────────
        decimal subtotal = 0;

        foreach (var itemDto in dto.Items)
        {
            // Re-fetch price here (already validated above, so never null)
            var price = await _orderRepository.GetProductPriceAsync(
                itemDto.ProductId, cancellationToken)
                ?? throw new KeyNotFoundException(
                    "Product not found during order processing.");

            var orderItem = new OrderDetail
            {
                ProductId = itemDto.ProductId,
                Quantity  = itemDto.Quantity,
                Price     = price
            };

            order.OrderItems.Add(orderItem);
            subtotal += price * itemDto.Quantity;
        }

        order.TotalAmount = Math.Round(subtotal, 2);

        // ── 6. Apply discount (in-memory, before save) ───────────
        if (!string.IsNullOrWhiteSpace(dto.DiscountCode))
        {
            var discount = await _orderRepository.GetValidDiscountAsync(
                dto.DiscountCode, order.TotalAmount, cancellationToken);

            if (discount == null)
                throw new InvalidOperationException(
                    "Invalid, expired, or inapplicable discount code.");

            var discountAmount = discount.IsPercentage
                ? Math.Round(order.TotalAmount * discount.DiscountValue / 100m, 2)
                : discount.DiscountValue;

            // Discount cannot exceed the order total
            discountAmount = Math.Min(discountAmount, order.TotalAmount);

            order.DiscountId       = discount.Id;
            order.DiscountAmount   = discountAmount;
            order.IsDiscountApplied = true;
            order.TotalAmount      = Math.Round(order.TotalAmount - discountAmount, 2);

            // Increment usage counter on the discount entity
            discount.TimesUsed++;
        }

        // ── 7. Persist everything in one save ────────────────────
        await _orderRepository.AddAsync(order, cancellationToken);

        return order.Id;
    }

    public async Task UpdateAsync(UpdateOrderDto dto, CancellationToken cancellationToken = default)
    {
        var order = await _context.Orders
            .Include(o => o.OrderItems)
            .FirstOrDefaultAsync(o => o.Id == dto.Id, cancellationToken)
            ?? throw new KeyNotFoundException("Order not found.");

        if (order.Status != OrderStatus.New && order.Status != OrderStatus.Pending)
            throw new InvalidOperationException(
                "Only new or pending orders can be modified.");

        order.Name       = dto.Name;
        order.Email      = dto.Email;
        order.ShipAddress = dto.ShipAddress;
        order.Phone      = dto.Phone;
        order.Note       = dto.Note;

        _context.OrderItems.RemoveRange(order.OrderItems);
        order.OrderItems.Clear();

        decimal subtotal = 0;

        foreach (var item in dto.Items)
        {
            var product = await _context.Products
                .FirstOrDefaultAsync(p => p.Id == item.ProductId, cancellationToken)
                ?? throw new KeyNotFoundException($"Product {item.ProductId} not found.");

            subtotal += product.Price * item.Quantity;

            order.OrderItems.Add(new OrderDetail
            {
                OrderId   = order.Id,
                ProductId = product.Id,
                Quantity  = item.Quantity,
                Price     = product.Price
            });
        }

        // Reset discount before potentially re-applying
        order.Discount       = null;
        order.DiscountAmount = 0;

        if (!string.IsNullOrWhiteSpace(dto.DiscountCode))
        {
            var discount = await _context.Discounts
                .FirstOrDefaultAsync(d => d.Code == dto.DiscountCode, cancellationToken);

            if (discount is { IsActive: true } &&
                DateTime.UtcNow >= discount.StartDate &&
                DateTime.UtcNow <= discount.EndDate &&
                (!discount.MaxUses.HasValue || discount.TimesUsed < discount.MaxUses) &&
                (!discount.MinimumOrderAmount.HasValue || subtotal >= discount.MinimumOrderAmount))
            {
                var discountAmount = discount.IsPercentage
                    ? Math.Round(subtotal * discount.DiscountValue / 100m, 2)
                    : Math.Min(discount.DiscountValue, subtotal);

                discount.TimesUsed++;
                order.Discount       = discount;
                order.DiscountAmount = discountAmount;
            }
        }

        order.TotalAmount = Math.Max(0, Math.Round(subtotal - order.DiscountAmount, 2));
        order.UpdatedAt   = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);
    }

    public async Task<Order?> GetByIdAsync(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        return await _orderRepository.GetByIdAsync(id, cancellationToken);
    }

   public async Task ChangeStatusAsync(
        Guid orderId,
        OrderStatus newStatus,
        CancellationToken cancellationToken = default)
    {
        var order = await _orderRepository.GetByIdAsync(orderId, cancellationToken)
            ?? throw new KeyNotFoundException("Order not found.");

        if (order.IsDeleted)
            throw new InvalidOperationException("Cannot change status of a cancelled order.");

        if (!OrderStatusTransitionPolicy.CanTransition(order.Status, newStatus))
            throw new InvalidOperationException(
                $"Invalid status transition from {order.Status} to {newStatus}.");

        order.Status    = newStatus;
        order.UpdatedAt = DateTime.UtcNow;

        await _orderRepository.SaveChangesAsync(cancellationToken);
    }

    public async Task CancelAsync(
        Guid orderId,
        CancellationToken cancellationToken = default)
    {
        var order = await _orderRepository.GetByIdAsync(orderId, cancellationToken)
            ?? throw new KeyNotFoundException("Order not found.");

        if (order.IsDeleted)
            throw new InvalidOperationException("Order is already cancelled.");

        if (order.Status == OrderStatus.Delivered || order.Status == OrderStatus.Shipped)
            throw new InvalidOperationException(
                "Cannot cancel orders that have been shipped or delivered.");

        order.IsDeleted  = true;
        order.Status     = OrderStatus.Cancelled;
        order.DeletedAt  = DateTime.UtcNow;
        order.UpdatedAt  = DateTime.UtcNow;

        await _orderRepository.SaveChangesAsync(cancellationToken);
    }

    public async Task DeletePermanentlyAsync(
        Guid orderId,
        CancellationToken cancellationToken = default)
    {
        var order = await _orderRepository.GetByIdAsync(orderId, cancellationToken)
            ?? throw new KeyNotFoundException("Order not found.");

        if (!order.IsDeleted)
            throw new InvalidOperationException(
                "Only cancelled orders can be permanently deleted. " +
                "Please cancel the order first.");

        var deleted = await _orderRepository.DeletePermanentlyAsync(orderId, cancellationToken);

        if (!deleted)
            throw new InvalidOperationException("Failed to delete order.");
    }

    public async Task ApplyDiscountAsync(
        Guid orderId,
        string discountCode,
        CancellationToken cancellationToken = default)
    {
        var order = await _orderRepository.GetByIdAsync(orderId, cancellationToken)
            ?? throw new KeyNotFoundException("Order not found.");

        // Business rule: Cannot apply discount twice
        if (order.IsDiscountApplied)
            throw new InvalidOperationException("Discount already applied to this order.");

        if (string.IsNullOrWhiteSpace(discountCode))
            throw new ArgumentException("Discount code is required.");

        // Validate discount
        var discount = await _orderRepository.GetValidDiscountAsync(
            discountCode,
            order.TotalAmount,
            cancellationToken);

        if (discount == null)
            throw new InvalidOperationException("Invalid or expired discount code.");

        // Calculate discount amount
        decimal discountAmount = 0;
        if (discount.IsPercentage)
        {
            discountAmount = Math.Round(order.TotalAmount * (discount.DiscountValue / 100), 2);
        }
        else
        {
            discountAmount = discount.DiscountValue;
        }

        // Business rule: Discount cannot exceed order total
        if (discountAmount > order.TotalAmount)
            discountAmount = order.TotalAmount;

        order.DiscountAmount = discountAmount;
        order.IsDiscountApplied = true;
        order.TotalAmount -= discountAmount;
        order.UpdatedAt = DateTime.UtcNow;

        await _orderRepository.SaveChangesAsync(cancellationToken);
    }

    // ===== Helper Methods =====
    private async Task<string> GenerateUniqueOrderCodeAsync(
        CancellationToken ct,
        int maxAttempts = 5)
    {
        for (var attempt = 0; attempt < maxAttempts; attempt++)
        {
            var code = $"HD{Guid.NewGuid():N}"[..12].ToUpper();

            if (!await _orderRepository.ExistsByCodeAsync(code, null, ct))
                return code;
        }

        throw new InvalidOperationException(
            "Failed to generate a unique order code after several attempts. Please retry.");
    }
}
