using LoLStore.Core.DTO;
using LoLStore.Core.Entities;
using LoLStore.Data.Contexts;
using Microsoft.EntityFrameworkCore;

namespace LoLStore.Services.Shop;

public class DashboardRepository : IDashboardRepository
{
    private readonly StoreDbContext _context;

    public DashboardRepository(StoreDbContext context)
    {
        _context = context;
    }

     public async Task<int> TotalOrder(CancellationToken cancellationToken = default)
    {
        return await _context.Set<Order>()
            .CountAsync(cancellationToken);
    }

    public async Task<int> OrderToday(CancellationToken cancellationToken = default)
    {
        var today = DateTime.UtcNow.Date;

        return await _context.Set<Order>()
            .CountAsync(o => o.OrderDate >= today, cancellationToken);
    }

    public async Task<int> TotalCategories(CancellationToken cancellationToken = default)
    {
        return await _context.Set<Category>()
            .CountAsync(cancellationToken);
    }

    public async Task<int> TotalProduct(CancellationToken cancellationToken = default)
    {
        return await _context.Set<Product>()
            .CountAsync(cancellationToken);
    }

    public async Task<decimal> RevenueTodayAsync(CancellationToken cancellationToken = default)
    {
        var today = DateTime.UtcNow.Date;

        return await _context.Set<Order>()
            .Where(o => o.OrderDate >= today)
            .SumAsync(o => o.TotalAmount, cancellationToken);
    }

    public async Task<decimal> TotalRevenue(CancellationToken cancellationToken = default)
    {
        return await _context.Set<Order>()
            .SumAsync(o => o.TotalAmount, cancellationToken);
    }


    public async Task<IList<RevenueOrderDto>> HourlyRevenueDetailAsync(
        CancellationToken cancellationToken = default)
    {
        var today = DateTime.UtcNow.Date;

        return await _context.Set<Order>()
            .Where(o => o.OrderDate >= today)
            .GroupBy(o =>
                new DateTime(
                    o.OrderDate.Year,
                    o.OrderDate.Month,
                    o.OrderDate.Day,
                    o.OrderDate.Hour,
                    0,
                    0))
            .OrderBy(g => g.Key)
            .Select(g => new RevenueOrderDto
            {
                Period = g.Key,
                TotalRevenue = g.Sum(o => o.TotalAmount),
                TotalOrder = g.Count(),
                TypeRevenue = TypeRevenue.Hour
            })
            .ToListAsync(cancellationToken);
    }

    public async Task<IList<RevenueOrderDto>> DailyRevenueDetailAsync(
        CancellationToken cancellationToken = default)
    {
        var fromDate = DateTime.UtcNow.Date.AddDays(-30);

        return await _context.Set<Order>()
            .Where(o => o.OrderDate >= fromDate)
            .GroupBy(o =>
                new DateTime(
                    o.OrderDate.Year,
                    o.OrderDate.Month,
                    o.OrderDate.Day))
            .OrderBy(g => g.Key)
            .Select(g => new RevenueOrderDto
            {
                Period = g.Key,
                TotalRevenue = g.Sum(o => o.TotalAmount),
                TotalOrder = g.Count(),
                TypeRevenue = TypeRevenue.Day
            })
            .ToListAsync(cancellationToken);
    }

    public async Task<IList<RevenueOrderDto>> MonthlyRevenueDetailAsync(
        CancellationToken cancellationToken = default)
    {
        var fromDate = DateTime.UtcNow.Date.AddYears(-1);

        return await _context.Set<Order>()
            .Where(o => o.OrderDate >= fromDate)
            .GroupBy(o =>
                new DateTime(
                    o.OrderDate.Year,
                    o.OrderDate.Month,
                    1))
            .OrderBy(g => g.Key)
            .Select(g => new RevenueOrderDto
            {
                Period = g.Key,
                TotalRevenue = g.Sum(o => o.TotalAmount),
                TotalOrder = g.Count(),
                TypeRevenue = TypeRevenue.Month
            })
            .ToListAsync(cancellationToken);
    }
}