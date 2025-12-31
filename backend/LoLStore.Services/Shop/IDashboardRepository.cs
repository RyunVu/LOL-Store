using LoLStore.Core.DTO;

namespace LoLStore.Services.Shop;

public interface IDashboardRepository
{
    	Task<int> TotalOrder(CancellationToken cancellationToken = default);

	Task<int> OrderToday(CancellationToken cancellationToken = default);
	
	Task<int> TotalCategories(CancellationToken cancellationToken = default);
	
	Task<int> TotalProduct(CancellationToken cancellationToken = default);
	
	Task<decimal> RevenueTodayAsync(CancellationToken cancellationToken = default);

	Task<IList<RevenueOrderDto>> HourlyRevenueDetailAsync(CancellationToken cancellationToken = default);

	Task<IList<RevenueOrderDto>> DailyRevenueDetailAsync(CancellationToken cancellationToken = default);

	Task<IList<RevenueOrderDto>> MonthlyRevenueDetailAsync(CancellationToken cancellationToken = default);
	
	Task<decimal> TotalRevenue(CancellationToken cancellationToken = default);

}
