// using LoLStore.API.Models;
// using LoLStore.API.Models.OrderModel;
// using LoLStore.Services.Shop;
// using LoLStore.WebAPI.Models.OrderModel;
// using MapsterMapper;
// using Microsoft.AspNetCore.Mvc;

// namespace LoLStore.API.Endpoints;

// public static class OrderEndpoints
// {
//     public static WebApplication MapOrdersEndpoint(this WebApplication app)
//     {
//         var builder = app.MapGroup("/api/orders");

//         builder.MapGet("/", GetOrder)
//             .WithName("GetOrder")
//             .RequireAuthorization("RequireManagerRole")
//             .Produces<ApiResponse<IPagedList<OrderDto>>>();

//         return app;
//     }

//     private static Task<IResult> GetOrder(
//         [AsParameters] OrderFilterModel query,
//         [FromServices] IOrderRepository repository,
//         [FromServices] IMapper mapper)
//     {
        
//     }
// }