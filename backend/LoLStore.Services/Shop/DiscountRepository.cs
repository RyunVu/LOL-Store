using LoLStore.Core.Entities;
using LoLStore.Core.Queries;
using LoLStore.Data.Contexts;
using LoLStore.Services.Extensions;
using Microsoft.EntityFrameworkCore;

namespace LoLStore.Services.Shop;

public class DiscountRepository : IDiscountRepository
{
    private readonly StoreDbContext _context;

    public DiscountRepository(StoreDbContext context)
    {
        _context = context;
    }

    // Paging & Filtering
    public async Task<IPagedList<T>> GetPagedDiscountAsync<T>(
        DiscountQuery query,
        IPagingParams pagingParams,
        Func<IQueryable<Discount>, IQueryable<T>> mapper)
    {
        var discounts = FilterDiscount(query);
        var projected = mapper(discounts);

        return await projected.ToPagedListAsync(pagingParams);
    }

    private IQueryable<Discount> FilterDiscount(DiscountQuery query)
    {
        var now = DateTime.UtcNow;

        return _context.Set<Discount>()
            .AsNoTracking()
            .Where(d => !d.IsDeleted)
            .WhereIf(!string.IsNullOrWhiteSpace(query.Code),
                d => d.Code.Contains(query.Code!.Trim().ToUpper()))
            .WhereIf(query.IsActive.HasValue,
                d => d.IsActive == query.IsActive)
            .WhereIf(query.IsPercentage.HasValue,
                d => d.IsPercentage == query.IsPercentage)
            .WhereIf(query.DiscountValue.HasValue,
                d => d.DiscountValue == query.DiscountValue)
            .WhereIf(query.MinimunOrderAmount.HasValue,
                d => d.MinimunOrderAmount >= query.MinimunOrderAmount)
            .WhereIf(query.IsActive == true,
                d => d.IsActive &&
                     d.StartDate <= now &&
                     d.EndDate >= now &&
                     (d.MaxUses == null || d.TimesUsed < d.MaxUses))
            .WhereIf(query.Day.HasValue,
                d => d.CreatedAt.Day == query.Day)
            .WhereIf(query.Month.HasValue,
                d => d.CreatedAt.Month == query.Month)
            .WhereIf(query.Year.HasValue,
                d => d.CreatedAt.Year == query.Year);
    }

    // Queries
    public async Task<Discount?> GetDiscountByIdAsync(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        return await _context.Set<Discount>()
            .AsNoTracking()
            .FirstOrDefaultAsync(
                d => d.Id == id && !d.IsDeleted,
                cancellationToken);
    }

    public async Task<Discount?> GetDiscountByCodeAsync(
        string code,
        CancellationToken cancellationToken = default)
    {
        var normalizedCode = code.Trim().ToUpper();

        return await _context.Set<Discount>()
            .AsNoTracking()
            .FirstOrDefaultAsync(
                d => d.Code == normalizedCode &&
                    !d.IsDeleted,
                cancellationToken);
    }

    // Create / Update
    public async Task<Discount?> AddOrUpdateDiscountAsync(
        Discount discount,
        CancellationToken cancellationToken = default)
    {
        discount.Code = discount.Code.Trim().ToUpper();

        var existing = await _context.Set<Discount>()
            .FirstOrDefaultAsync(
                d => d.Id == discount.Id && !d.IsDeleted,
                cancellationToken);

        // CREATE
        if (existing == null)
        {
            discount.Id = Guid.NewGuid();
            discount.CreatedAt = DateTime.UtcNow;
            discount.IsDeleted = false;

            await _context.Set<Discount>()
                .AddAsync(discount, cancellationToken);

            await _context.SaveChangesAsync(cancellationToken);
            return discount;
        }

        // UPDATE (prevent expired discount edits)
        if (existing.EndDate < DateTime.UtcNow)
            throw new InvalidOperationException("Cannot update an expired discount.");

        existing.Code = discount.Code;
        existing.DiscountValue = discount.DiscountValue;
        existing.IsPercentage = discount.IsPercentage;
        existing.MinimunOrderAmount = discount.MinimunOrderAmount;
        existing.MaxUses = discount.MaxUses;
        existing.StartDate = discount.StartDate;
        existing.EndDate = discount.EndDate;
        existing.IsActive = discount.IsActive;
        existing.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);
        return existing;
    }

    // State Changes
    public async Task<bool> ToggleActiveAsync(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        return await _context.Set<Discount>()
            .Where(d => d.Id == id && !d.IsDeleted)
            .ExecuteUpdateAsync(
                d => d.SetProperty(
                    x => x.IsActive,
                    x => !x.IsActive),
                cancellationToken) > 0;
    }

    public async Task<bool> DeleteDiscountAsync(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        return await _context.Set<Discount>()
            .Where(d => d.Id == id && !d.IsDeleted)
            .ExecuteUpdateAsync(d =>
                d.SetProperty(x => x.IsDeleted, true)
                 .SetProperty(x => x.IsActive, false)
                 .SetProperty(x => x.DeletedAt, DateTime.UtcNow),
                cancellationToken) > 0;
    }

    // Validation
    public async Task<bool> IsDiscountExistedAsync(
        Guid id,
        string code,
        CancellationToken cancellationToken = default)
    {
        var normalizedCode = code.Trim().ToUpper();

        return await _context.Set<Discount>()
            .AnyAsync(d =>
                !d.IsDeleted &&
                d.Id != id &&
                d.Code == normalizedCode,
                cancellationToken);
    }
}
