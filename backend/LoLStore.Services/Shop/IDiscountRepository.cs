using LoLStore.Core.Entities;
using LoLStore.Core.Queries;

namespace LoLStore.Services.Shop;

public interface IDiscountRepository
{
    Task<IPagedList<T>> GetPagedDiscountAsync<T>(
        DiscountQuery query, 
        IPagingParams pagingParams, 
        Func<IQueryable<Discount>, IQueryable<T>> mapper);

    Task<Discount?> GetDiscountByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<Discount?> GetDiscountByCodeAsync(string code, CancellationToken cancellationToken = default);
    Task<Discount?> AddOrUpdateDiscountAsync(Discount discount, CancellationToken cancellationToken = default);
	Task<bool> ToggleActiveAsync(Guid id, CancellationToken cancellation = default);
	Task<bool> DeleteDiscountAsync(Guid id, CancellationToken cancellation = default);
	Task<bool> IsDiscountExistedAsync(Guid id, string code, CancellationToken cancellation = default);
}