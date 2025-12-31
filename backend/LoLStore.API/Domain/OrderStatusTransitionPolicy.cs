using LoLStore.Core.Entities;

namespace LoLStore.API.Domain.Orders;

public static class OrderStatusTransitionPolicy
{
    private static readonly Dictionary<OrderStatus, IReadOnlyList<OrderStatus>>
        _allowedTransitions = new()
        {
            { OrderStatus.New,        new[] { OrderStatus.Pending, OrderStatus.Cancelled } },
            { OrderStatus.Pending,    new[] { OrderStatus.Processing, OrderStatus.Cancelled } },
            { OrderStatus.Processing, new[] { OrderStatus.Shipped, OrderStatus.Cancelled } },
            { OrderStatus.Shipped,    new[] { OrderStatus.Delivered } },
            { OrderStatus.Delivered,  Array.Empty<OrderStatus>() },
            { OrderStatus.Cancelled,  Array.Empty<OrderStatus>() }
        };

    public static bool CanTransition(
        OrderStatus from,
        OrderStatus to)
    {
        return _allowedTransitions.TryGetValue(from, out var allowed)
            && allowed.Contains(to);
    }

    public static IReadOnlyList<OrderStatus> GetAllowedNext(
        OrderStatus current)
    {
        return _allowedTransitions.TryGetValue(current, out var allowed)
            ? allowed
            : Array.Empty<OrderStatus>();
    }
}
