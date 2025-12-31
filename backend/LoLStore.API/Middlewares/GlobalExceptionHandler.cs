using System.Net;
using LoLStore.API.Models;
using Microsoft.AspNetCore.Diagnostics;

namespace LoLStore.API.Middlewares;

public static class GlobalExceptionHandler
{
    public static void UseGlobalExceptionHandler(this WebApplication app)
    {
        app.UseExceptionHandler(errorApp =>
        {
            errorApp.Run(async context =>
            {
                var exceptionHandler =
                    context.Features.Get<IExceptionHandlerFeature>();

                var exception = exceptionHandler?.Error;

                context.Response.StatusCode =
                    (int)HttpStatusCode.InternalServerError;

                context.Response.ContentType = "application/json";

                var response = ApiResponse.Fail(
                    HttpStatusCode.InternalServerError,
                    "An unexpected error occurred."
                );

                var logger = context.RequestServices
                    .GetRequiredService<ILoggerFactory>()
                    .CreateLogger("GlobalException");

                logger.LogError(
                    exception,
                    "Unhandled exception at {Path}",
                    context.Request.Path
                );

                await context.Response.WriteAsJsonAsync(response);
            });
        });
    }
}