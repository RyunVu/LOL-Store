using LoLStore.Core.Entities;

namespace LoLStore.Services.Extensions;

public static class OrderStatusTransitionPolicy
{
    private static readonly IReadOnlyDictionary<OrderStatus, IReadOnlySet<OrderStatus>> AllowedTransitions =
        new Dictionary<OrderStatus, IReadOnlySet<OrderStatus>>
        {
            [OrderStatus.None]       = new HashSet<OrderStatus> { OrderStatus.New },
            [OrderStatus.New]        = new HashSet<OrderStatus> { OrderStatus.Pending, OrderStatus.Cancelled },
            [OrderStatus.Pending]    = new HashSet<OrderStatus> { OrderStatus.Processing, OrderStatus.Cancelled },
            [OrderStatus.Processing] = new HashSet<OrderStatus> { OrderStatus.Shipped, OrderStatus.Cancelled },
            [OrderStatus.Shipped]    = new HashSet<OrderStatus> { OrderStatus.Delivered },
            [OrderStatus.Delivered]  = new HashSet<OrderStatus>(),
            [OrderStatus.Cancelled]  = new HashSet<OrderStatus>()
        };

    public static bool CanTransition(OrderStatus from, OrderStatus to)
    {
        if (from == to)
            return false;

        return AllowedTransitions.TryGetValue(from, out var allowed)
               && allowed.Contains(to);
    }

    public static IReadOnlyCollection<OrderStatus> GetAllowedNextStatuses(
        OrderStatus currentStatus)
    {
        return AllowedTransitions.TryGetValue(currentStatus, out var allowed)
            ? allowed.ToArray()
            : Array.Empty<OrderStatus>();
    }
}
