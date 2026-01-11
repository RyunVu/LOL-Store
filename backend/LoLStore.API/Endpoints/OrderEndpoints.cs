using System.Net;
using LoLStore.API.Domain.Orders;
using LoLStore.API.Filter;
using LoLStore.API.Identities;
using LoLStore.API.Models;
using LoLStore.API.Models.OrderModel;
using LoLStore.Core.Entities;
using LoLStore.Core.Queries;
using LoLStore.Services.Shop;
using LoLStore.WebAPI.Models.OrderModel;
using Mapster;
using MapsterMapper;
using Microsoft.AspNetCore.Mvc;

namespace LoLStore.API.Endpoints;

public static class OrderEndpoints
{
    public static WebApplication MapOrdersEndpoint(this WebApplication app)
    {
        var builder = app.MapGroup("/api/orders");

        builder.MapGet("/", GetOrder)
            .RequireAuthorization("RequireManagerRole")
            .Produces<ApiResponse<IPagedList<OrderDto>>>();

        builder.MapGet("/byUser", GetOrderByUser)
            .RequireAuthorization()
            .Produces<ApiResponse<IPagedList<OrderDto>>>();

        builder.MapPost("/checkout", CheckOut)
            .RequireAuthorization()
            .AddEndpointFilter<ValidatorFilter<OrderEditModel>>()
            .Produces<ApiResponse<OrderDto>>();

        builder.MapGet("/{orderId:guid}", GetOrderById)
            .Produces<ApiResponse<OrderDto>>();

        builder.MapGet("/code/{orderCode}", GetOrderByCode)
            .Produces<ApiResponse<OrderDto>>();

        builder.MapPut("/{orderId:guid}/status", UpdateOrderStatus)
            .RequireAuthorization("RequireManagerRole")
            .Produces<ApiResponse<OrderDto>>();

        builder.MapDelete("/{orderId:guid}/cancel", CancelOrderByUser)
            .RequireAuthorization()
            .Produces<ApiResponse<OrderDto>>();

        return app;
    }


    private static async Task<IResult> GetOrder(
        [AsParameters] OrderFilterModel model,
        [FromServices] IOrderRepository repository,
        [FromServices] IMapper mapper)
    {
        model.SortColumn ??= "OrderDate";
        var query = mapper.Map<OrderQuery>(model);

        var orders = await repository.GetPagedOrderAsync(
            query,
            model,
            p => p.ProjectToType<OrderDto>());

        return Results.Ok(
            ApiResponse.Success(new PaginationResult<OrderDto>(orders)));
    }

    private static async Task<IResult> GetOrderByUser(
        HttpContext context,
        [AsParameters] OrderFilterModel model,
        [FromServices] IOrderRepository repository,
        [FromServices] IMapper mapper)
    {
        var user = context.GetCurrentUser();
        if (user is null)
            return Results.Unauthorized();

        model.SortColumn ??= "OrderDate";
        var query = mapper.Map<OrderQuery>(model);

        var orders = await repository.GetPagedOrdersByUserAsync(
            user.Id,
            query,
            model,
            p => p.ProjectToType<OrderDto>());

        return Results.Ok(
            ApiResponse.Success(new PaginationResult<OrderDto>(orders)));
    }

    private static async Task<IResult> CheckOut(
        HttpContext context,
        [FromBody] OrderEditModel model,
        [FromServices] IOrderRepository repository,
        [FromServices] IProductRepository productRepo,
        [FromServices] IMapper mapper)
    {
        if (!model.Detail.Any() || model.Detail.Any(d => d.Quantity <= 0))
        {
            return Results.BadRequest(
                ApiResponse.Fail(
                    HttpStatusCode.BadRequest,
                    "Order must contain at least one product with a valid quantity."));
        }

        if (!string.IsNullOrWhiteSpace(model.DiscountCode))
        {
            var tempOrder = await repository.GetProductOrderAsync(model.Detail);
            var discount = await repository.CheckValidDiscountAsync(
                model.DiscountCode,
                tempOrder.TotalAmount);

            if (discount is null)
            {
                return Results.Json(
                    ApiResponse.Fail(
                        HttpStatusCode.NotAcceptable,
                        "Discount code is invalid or unavailable."),
                    statusCode: StatusCodes.Status406NotAcceptable);
            }
        }

        var outOfStock = new List<string>();

        foreach (var item in model.Detail)
        {
            if (!await repository.CheckQuantityProductAsync(
                    item.Id,
                    item.Quantity!.Value)) 
            {
                var product = await productRepo.GetProductByIdAsync(item.Id);
                outOfStock.Add(product is null
                    ? "Product does not exist."
                    : $"Product '{product.Name}' is out of stock.");
            }
        }

        if (outOfStock.Any())
        {
            return Results.UnprocessableEntity(
                ApiResponse.Fail(HttpStatusCode.UnprocessableEntity, outOfStock.ToArray()));
        }

        var userDto = context.GetCurrentUser();
        if (userDto is null)
            return Results.Unauthorized();

        var order = mapper.Map<Order>(model);
        var user = mapper.Map<User>(userDto);

        order = await repository.AddOrderAsync(order, user);
        await repository.AddProductOrderAsync(order.Id, model.Detail);

        if (!string.IsNullOrWhiteSpace(model.DiscountCode))
        {
            await repository.AddDiscountOrderAsync(order, model.DiscountCode);
        }

        return Results.Ok(
            ApiResponse.Success(mapper.Map<OrderDto>(order)));
    }


    private static async Task<IResult> GetOrderById(
        [FromRoute] Guid orderId,
        [FromServices] IOrderRepository repository,
        [FromServices] IMapper mapper)
    {
        var order = await repository.GetOrderByIdAsync(orderId);
        if (order is null)
            return Results.NotFound(
                ApiResponse.Fail(HttpStatusCode.NotFound, "Order was not found."));

        return Results.Ok(
            ApiResponse.Success(mapper.Map<OrderDto>(order)));
    }

    private static async Task<IResult> GetOrderByCode(
        [FromRoute] string orderCode,
        [FromServices] IOrderRepository repository,
        [FromServices] IMapper mapper)
    {
        var order = await repository.GetOrderByCodeAsync(orderCode);
        if (order is null)
            return Results.NotFound(
                ApiResponse.Fail(HttpStatusCode.NotFound, "Order was not found."));

        return Results.Ok(
            ApiResponse.Success(mapper.Map<OrderDto>(order)));
    }


    private static async Task<IResult> UpdateOrderStatus(
        [FromRoute] Guid orderId,
        [FromQuery] OrderStatus newStatus,
        [FromServices] IOrderRepository repository,
        [FromServices] IMapper mapper)
    {
        var order = await repository.GetOrderByIdAsync(orderId);
        if (order is null)
            return Results.NotFound(
                ApiResponse.Fail(HttpStatusCode.NotFound, "Order was not found."));

        if (!OrderStatusTransitionPolicy.CanTransition(order.Status, newStatus))
        {
            return Results.BadRequest(
                ApiResponse.Fail(
                    HttpStatusCode.BadRequest,
                    $"Invalid order status transition from '{order.Status}' to '{newStatus}'."));
        }

        order.Status = newStatus;
        await repository.ToggleOrderAsync(order, newStatus);

        return Results.Ok(
            ApiResponse.Success(mapper.Map<OrderDto>(order)));
    }

    private static async Task<IResult> CancelOrderByUser(
        HttpContext context,
        [FromRoute] Guid orderId,
        [FromServices] IOrderRepository repository,
        [FromServices] IMapper mapper)
    {
        var order = await repository.GetOrderByIdAsync(orderId);
        if (order is null)
            return Results.NotFound(
                ApiResponse.Fail(HttpStatusCode.NotFound, "Order was not found."));

        var user = context.GetCurrentUser();
        if (user is null)
            return Results.Unauthorized();

        if (order.UserId != user.Id)
        {
            return Results.Forbid();
        }

        if (!OrderStatusTransitionPolicy.CanTransition(
                order.Status,
                OrderStatus.Cancelled))
        {
            return Results.UnprocessableEntity(
                ApiResponse.Fail(
                    HttpStatusCode.UnprocessableEntity,
                    "This order can no longer be cancelled."));
        }

        order = await repository.CancelOrderAsync(orderId);

        return Results.Ok(
            ApiResponse.Success(mapper.Map<OrderDto>(order)));
    }
}
