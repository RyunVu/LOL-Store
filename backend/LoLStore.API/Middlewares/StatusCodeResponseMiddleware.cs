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
        context.Response.OnStarting(() =>
        {
            var code = context.Response.StatusCode;

            if (code == StatusCodes.Status401Unauthorized || code == StatusCodes.Status403Forbidden)
            {
                context.Response.ContentType = "application/json";

                var apiRes = code switch
                {
                    StatusCodes.Status401Unauthorized => ApiResponse.Fail(HttpStatusCode.Unauthorized, "Unauthorized"),
                    StatusCodes.Status403Forbidden    => ApiResponse.Fail(HttpStatusCode.Forbidden, "Forbidden"),
                    _ => null
                };

                if (apiRes != null)
                {
                    var options = new JsonSerializerOptions
                    {
                        PropertyNamingPolicy = JsonNamingPolicy.CamelCase
                    };

                    var json = JsonSerializer.Serialize(apiRes, options);
                    return context.Response.WriteAsync(json);
                }
            }

            return Task.CompletedTask;
        });

        await _next(context);
    }
}
