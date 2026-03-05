using LoLStore.API.Identities;
using LoLStore.API.Models;
using LoLStore.Services.Payment;
using LoLStore.Services.Shop.Orders;
using Microsoft.AspNetCore.Mvc;

namespace LoLStore.API.Endpoints;

public static class PaymentEndpoint
{
    public static WebApplication MapPaymentEndpoint(this WebApplication app)
    {
        var builder = app.MapGroup("/api/payment");

        builder.MapPost("/create/{orderId:guid}", CreatePayment)
            .RequireAuthorization();

        builder.MapGet("/callback", HandleCallback);

        builder.MapPost("/ipn", HandleIpn);

        return app;
    }

    private static async Task<IResult> CreatePayment(
        [FromRoute] Guid orderId,
        HttpContext context,
        [FromServices] IVnpayService vnpayService,
        [FromServices] IOrderRepository orderRepo,
        CancellationToken ct)
    {
        var user = context.GetCurrentUser();
        if (user == null) return Results.Unauthorized();

        var order = await orderRepo.GetByIdAsync(orderId, ct);
        if (order == null)
            return Results.NotFound(ApiResponse.Fail(
                System.Net.HttpStatusCode.NotFound, "Order not found"));

        // Only allow owner to pay
        if (order.UserId != user.Id)
            return Results.Forbid();

        var ipAddress = context.Connection.RemoteIpAddress?.ToString() ?? "127.0.0.1";
        var paymentUrl = vnpayService.CreatePaymentUrl(
            orderId,
            order.TotalAmount,
            $"Thanh toan don hang {order.CodeOrder}",
            ipAddress);

        return Results.Ok(ApiResponse.Success(new { paymentUrl }));
    }

    // VNPay redirects user back here after payment
    private static async Task<IResult> HandleCallback(
        HttpContext context,
        [FromServices] IVnpayService vnpayService,
        [FromServices] IOrderService orderService,
        CancellationToken ct)
    {
        var result = vnpayService.ProcessCallback(context.Request.Query);

        if (result.IsSuccess && Guid.TryParse(result.OrderId, out var orderId))
        {
            await orderService.MarkOrderAsPaidAsync(orderId, result.TransactionId, ct);
        }

        // Redirect to frontend result page with query params
        var status = result.IsSuccess ? "success" : "failed";
        var redirectUrl = $"{context.Request.Scheme}://localhost:5173/payment/result" +
                          $"?status={status}&orderId={result.OrderId}&code={result.ResponseCode}";

        return Results.Redirect(redirectUrl);
    }

    // VNPay calls this server-to-server to confirm payment
    private static async Task<IResult> HandleIpn(
        HttpContext context,
        [FromServices] IVnpayService vnpayService,
        [FromServices] IOrderService orderService,
        CancellationToken ct)
    {
        var result = vnpayService.ProcessCallback(context.Request.Query);

        if (result.IsSuccess && Guid.TryParse(result.OrderId, out var orderId))
        {
            await orderService.MarkOrderAsPaidAsync(orderId, result.TransactionId, ct);
            return Results.Ok(new { RspCode = "00", Message = "Confirm Success" });
        }

        return Results.Ok(new { RspCode = "99", Message = "Unknown error" });
    }
}