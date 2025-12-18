using System.Net;
using System.Text.Json;
using LoLStore.API.Models;

namespace LoLStore.API.Middlewares;

public class StatusCodeResponseMiddleware
{
    private readonly RequestDelegate _next;

    public StatusCodeResponseMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        await _next(context);

        if (context.Response.HasStarted)
            return;

        var statusCode = context.Response.StatusCode;

        if (statusCode is StatusCodes.Status401Unauthorized or StatusCodes.Status403Forbidden)
        {
            context.Response.Clear();
            context.Response.ContentType = "application/json";

            var apiResponse = statusCode switch
            {
                StatusCodes.Status401Unauthorized =>
                    ApiResponse.Fail(HttpStatusCode.Unauthorized, "Unauthorized"),

                StatusCodes.Status403Forbidden =>
                    ApiResponse.Fail(HttpStatusCode.Forbidden, "Forbidden"),

                _ => null
            };

            if (apiResponse != null)
            {
                var json = JsonSerializer.Serialize(
                    apiResponse,
                    new JsonSerializerOptions
                    {
                        PropertyNamingPolicy = JsonNamingPolicy.CamelCase
                    });

                await context.Response.WriteAsync(json);
            }
        }
    }
}
