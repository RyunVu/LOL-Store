using LoLStore.API.Models;
using LoLStore.API.Models.DashboardModel;
using LoLStore.Core.DTO;
using LoLStore.Services.Shop;
using Microsoft.AspNetCore.Mvc;

namespace LoLStore.API.Endpoints;

public static class DashboardEndpoints
{
    public static WebApplication MapDashboardEndpoint(this WebApplication app)
    {
        var builder = app.MapGroup("/api/dashboard");

        builder.MapGet("/", GetDashboard)
            .WithName("GetDashboard")
            .Produces<ApiResponse<DashboardDto>>(StatusCodes.Status200OK);

        builder.MapGet("/revenue-detail", GetRevenueDetail)
            .WithName("GetRevenueDetail")
            .Produces<ApiResponse<IList<RevenueOrderDto>>>(StatusCodes.Status200OK)
            .Produces(StatusCodes.Status204NoContent);

        return app;
    }

    private static async Task<IResult> GetDashboard(
        [FromServices] IDashboardRepository repository)
    {
        var totalOrderTask = repository.TotalOrder();
        var orderTodayTask = repository.OrderToday();
        var totalCategoriesTask = repository.TotalCategories();
        var totalProductTask = repository.TotalProduct();
        var revenueTodayTask = repository.RevenueTodayAsync();
        var totalRevenueTask = repository.TotalRevenue();

        await Task.WhenAll(
            totalOrderTask,
            orderTodayTask,
            totalCategoriesTask,
            totalProductTask,
            revenueTodayTask,
            totalRevenueTask
        );

        var dashboard = new DashboardDto
        {
            TotalOrder = totalOrderTask.Result,
            OrderToday = orderTodayTask.Result,
            TotalCategories = totalCategoriesTask.Result,
            TotalProduct = totalProductTask.Result,
            RevenueToday = revenueTodayTask.Result,
            TotalRevenue = totalRevenueTask.Result
        };

        return Results.Ok(ApiResponse.Success(dashboard));
    }

    private static async Task<IResult> GetRevenueDetail(
        [AsParameters] DashboardFilterModel model,
        [FromServices] IDashboardRepository repository)
    {
        IList<RevenueOrderDto>? result = model.Type switch
        {
            TypeRevenue.Hour => await repository.HourlyRevenueDetailAsync(),
            TypeRevenue.Day => await repository.DailyRevenueDetailAsync(),
            TypeRevenue.Month => await repository.MonthlyRevenueDetailAsync(),
            TypeRevenue.Year => await repository.MonthlyRevenueDetailAsync(), 
            _ => null
        };

        if (result == null || result.Count == 0)
        {
            return Results.NoContent();
        }

        return Results.Ok(ApiResponse.Success(result));
    }
}
