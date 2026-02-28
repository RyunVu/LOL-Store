using System.Net;
using System.Security.Claims;
using LoLStore.API.Filter;
using LoLStore.API.Identities;
using LoLStore.API.Models;
using LoLStore.API.Models.OrderModel;
using LoLStore.Core.DTO.Orders;
using LoLStore.Core.Entities;
using LoLStore.Core.Queries;
using LoLStore.Services.Shop.Orders;
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
        
        builder.MapPut("/{id:guid}", UpdateOrder)
            .RequireAuthorization("RequireManagerRole");

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

        var orders = await repository.GetPagedOrdersAsync(
            query,
            model,
            p => p.ProjectToType<OrderAdminDto>());

        return Results.Ok(
            ApiResponse.Success(new PaginationResult<OrderAdminDto>(orders)));
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
        [FromServices] IOrderService orderService,
        [FromServices] IMapper mapper)
    {
        try
        {
            var userIdClaim = context.User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!Guid.TryParse(userIdClaim, out var userId))
                return Results.Unauthorized();

            var dto = new CreateOrderDto
            {
                Name = model.Name,
                Email = context.User.FindFirst(ClaimTypes.Email)?.Value ?? string.Empty,
                ShipAddress = model.ShipAddress,
                Phone = model.Phone,
                Note = model.Note,
                DiscountCode = model.DiscountCode,
                Items = model.Detail.Select(d => new OrderItemDto
                {
                    ProductId = d.Id,
                    Quantity = d.Quantity ?? 0
                }).ToList()
            };

            var orderId = await orderService.CreateAsync(userId, dto);
            var order = await orderService.GetByIdAsync(orderId);

            if (order == null)
                return Results.StatusCode(StatusCodes.Status500InternalServerError);

            var response = order.Adapt<OrderDto>();
            return Results.Ok(ApiResponse.Success(response));
        }
        catch (InvalidOperationException ex)
        {
            return Results.BadRequest(
                ApiResponse.Fail(HttpStatusCode.BadRequest, ex.Message));
        }
        catch (KeyNotFoundException ex)
        {
            return Results.NotFound(
                ApiResponse.Fail(HttpStatusCode.NotFound, ex.Message));
        }
    }


    private static async Task<IResult> GetOrderById(
        [FromRoute] Guid orderId,
        [FromServices] IOrderRepository repository,
        [FromServices] IMapper mapper)
    {
        var order = await repository.GetByIdWithDetailsAsync(orderId);
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
        var order = await repository.GetByCodeAsync(orderCode);
        if (order is null)
            return Results.NotFound(
                ApiResponse.Fail(HttpStatusCode.NotFound, "Order was not found."));

        return Results.Ok(
            ApiResponse.Success(mapper.Map<OrderDto>(order)));
    }


    private static async Task<IResult> UpdateOrderStatus(
        [FromRoute] Guid orderId,
        [FromQuery] OrderStatus newStatus,
        [FromServices] IOrderService orderService,
        [FromServices] IMapper mapper)
    {
        try
        {
            var order = await orderService.GetByIdAsync(orderId);
            if (order is null)
                return Results.NotFound(
                    ApiResponse.Fail(HttpStatusCode.NotFound, "Order was not found."));

            await orderService.ChangeStatusAsync(orderId, newStatus);
            
            var updatedOrder = await orderService.GetByIdAsync(orderId);

            if (updatedOrder == null)
                return Results.StatusCode(StatusCodes.Status500InternalServerError);

            return Results.Ok(
                ApiResponse.Success(mapper.Map<OrderAdminDto>(updatedOrder)));
        }
        catch (InvalidOperationException ex)
        {
            return Results.BadRequest(
                ApiResponse.Fail(HttpStatusCode.BadRequest, ex.Message));
        }
    }

    private static async Task<IResult> UpdateOrder(
        [FromRoute] Guid id,
        [FromBody] OrderEditModel? model,
        [FromServices] IOrderService service,
        [FromServices] IMapper mapper)
    {        
        var dto = mapper.Map<UpdateOrderDto>((id, model));

        await service.UpdateAsync(dto);

        return Results.Ok(ApiResponse.Success(
            ApiResponse.Success("Order updated successfully.", HttpStatusCode.OK)
        ));
    }


    private static async Task<IResult> CancelOrderByUser(
        HttpContext context,
        [FromRoute] Guid orderId,
        [FromServices] IOrderService orderService,
        [FromServices] IMapper mapper)
    {
        try
        {
            var user = context.GetCurrentUser();
            if (user is null)
                return Results.Unauthorized();

            var order = await orderService.GetByIdAsync(orderId);
            if (order is null)
                return Results.NotFound(
                    ApiResponse.Fail(HttpStatusCode.NotFound, "Order was not found."));

            if (order.UserId != user.Id)
                return Results.Forbid();

            await orderService.CancelAsync(orderId);

            var updatedOrder = await orderService.GetByIdAsync(orderId);

            if (updatedOrder == null)
                return Results.StatusCode(StatusCodes.Status500InternalServerError);
                
            return Results.Ok(
                ApiResponse.Success(mapper.Map<OrderDto>(updatedOrder)));
        }
        catch (InvalidOperationException ex)
        {
            return Results.UnprocessableEntity(
                ApiResponse.Fail(HttpStatusCode.UnprocessableEntity, ex.Message));
        }
    }
}
