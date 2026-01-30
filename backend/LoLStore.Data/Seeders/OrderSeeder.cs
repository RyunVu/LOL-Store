using LoLStore.Core.Entities;

namespace LoLStore.Data.Seeders;

public static class OrderSeeder
{
    public static List<Order> Generate(
        IList<User> users,
        IList<Product> products,
        IList<Discount> discounts,
        int maxOrdersPerUser = 5
    )
    {
        var random = Random.Shared;
        var orders = new List<Order>();

        var validProducts = products
            .Where(p => p.IsActive && !p.IsDeleted)
            .ToList();

        foreach (var user in users)
        {
            var orderCount = random.Next(0, maxOrdersPerUser + 1);

            for (int i = 0; i < orderCount; i++)
            {
                var orderId = Guid.NewGuid();
                var orderDate = DateTime.UtcNow.AddDays(-random.Next(1, 90));

                // ---------- Order Items ----------
                var items = validProducts
                    .OrderBy(_ => random.Next())
                    .Take(random.Next(1, 6))
                    .Select(p =>
                    {
                        p.CountOrder++;

                        return new OrderDetail
                        {
                            OrderId = orderId,
                            ProductId = p.Id,
                            Price = p.Price,
                            Quantity = random.Next(1, 4)
                        };
                    })
                    .ToList();

                var subTotal = items.Sum(i => i.TotalPrice);

                // ---------- Discount ----------
                var discountResult = TryApplyDiscount(discounts, subTotal);
                var discountAmount = discountResult?.amount ?? 0;

                orders.Add(new Order
                {
                    Id = orderId,
                    UserId = user.Id,
                    OrderDate = orderDate,
                    CodeOrder = $"ORD-{orderDate.Year}-{random.Next(100000, 999999)}",

                    Status = GetWeightedStatus(),

                    Name = user.Name,
                    Email = user.Email,
                    Phone = user.Phone ?? "N/A",
                    ShipAddress = user.Address ?? "Unknown address",

                    IsDiscountApplied = discountResult != null,
                    Discount = discountResult?.discount,
                    DiscountAmount = discountAmount,

                    TotalAmount = Math.Max(0, subTotal - discountAmount),
                    OrderItems = items
                });
            }
        }

        return orders;
    }

    // ---------------- HELPERS ----------------

    private static (Discount discount, decimal amount)? TryApplyDiscount(
        IList<Discount> discounts,
        decimal subTotal
    )
    {
        if (Random.Shared.NextDouble() > 0.3)
            return null;

        var now = DateTime.UtcNow;

        var discount = discounts
            .Where(d =>
                d.IsActive &&
                d.StartDate <= now &&
                d.EndDate >= now &&
                (d.MinimunOrderAmount == null || subTotal >= d.MinimunOrderAmount) &&
                (d.MaxUses == null || d.TimesUsed < d.MaxUses)
            )
            .OrderBy(_ => Random.Shared.Next())
            .FirstOrDefault();

        if (discount == null)
            return null;

        decimal amount = discount.IsPercentage
            ? Math.Round(subTotal * discount.DiscountValue / 100, 2)
            : discount.DiscountValue;

        discount.TimesUsed++;

        return (discount, Math.Min(amount, subTotal));
    }

    private static OrderStatus GetWeightedStatus()
    {
        var statuses = new[]
        {
            OrderStatus.Delivered,
            OrderStatus.Delivered,
            OrderStatus.Shipped,
            OrderStatus.Processing,
            OrderStatus.Pending,
            OrderStatus.Cancelled
        };

        return statuses[Random.Shared.Next(statuses.Length)];
    }
}
