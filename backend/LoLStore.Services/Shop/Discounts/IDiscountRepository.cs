using LoLStore.Core.Entities;
using LoLStore.Core.Queries;

namespace LoLStore.Services.Shop.Discounts;

public interface IDiscountRepository
{
    Task<IPagedList<T>> GetPagedDiscountAsync<T>(
        DiscountQuery query, 
        IPagingParams pagingParams, 
        Func<IQueryable<Discount>, IQueryable<T>> mapper,
        CancellationToken ct = default);

    Task<IPagedList<T>> GetPagedDiscountForUserAsync<T>(
        DiscountQuery query, 
        IPagingParams pagingParams, 
        Func<IQueryable<Discount>, IQueryable<T>> mapper,
        CancellationToken ct = default);

    Task<Discount?> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<Discount?> GetByCodeAsync(string code, CancellationToken ct = default);

    // ===== Write =====
    Task AddAsync(Discount discount, CancellationToken ct = default);
    Task SaveChangesAsync(CancellationToken ct = default);
    Task<bool> DeletePermanentlyAsync(Discount discount, CancellationToken ct = default);

    // ===== Validation ======
    Task<bool> IsDiscountExistedAsync(string code, CancellationToken ct = default);
}
