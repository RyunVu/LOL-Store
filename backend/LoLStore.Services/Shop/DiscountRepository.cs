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
            .WhereIf(query.IsPercentage.HasValue,
                d => d.IsPercentage == query.IsPercentage)
            .WhereIf(query.DiscountValue.HasValue,
                d => d.DiscountValue == query.DiscountValue)
            .WhereIf(query.MinPrice.HasValue,
                d => d.MinimunOrderAmount >= query.MinPrice)
            .WhereIf(query.StartDate.HasValue,
                d => d.StartDate >= query.StartDate)
            .WhereIf(query.EndDate.HasValue,
                d => d.EndDate <= query.EndDate)
            .WhereIf(query.Day.HasValue,
                d => d.CreatedAt.Day == query.Day)
            .WhereIf(query.Month.HasValue,
                d => d.CreatedAt.Month == query.Month)
            .WhereIf(query.Year.HasValue,
                d => d.CreatedAt.Year == query.Year);
    }

    public async Task<Discount?> GetDiscountByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await _context.Set<Discount>()
            .AsNoTracking()
            .FirstOrDefaultAsync(d => d.Id == id, cancellationToken);
    }

    public async Task<Discount?> GetDiscountByCodeAsync(string code, CancellationToken cancellationToken = default)
    {
        return await _context.Set<Discount>()
            .AsNoTracking()
            .FirstOrDefaultAsync(d => d.Code.ToLower() == code.ToLower(), cancellationToken);
    }

    public async Task<Discount?> AddOrUpdateDiscountAsync(
        Discount discount,
        CancellationToken cancellationToken = default)
    {
        var exists = await _context.Set<Discount>()
            .AnyAsync(d => d.Id == discount.Id, cancellationToken);

        if (exists)
        {
            _context.Set<Discount>().Update(discount);
        }
        else
        {
            discount.Id = Guid.NewGuid();
            discount.CreatedAt = DateTime.UtcNow;
            await _context.Set<Discount>().AddAsync(discount, cancellationToken);
        }

        await _context.SaveChangesAsync(cancellationToken);
        return discount;
    }

    public async Task<bool> ToggleActiveAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await _context.Set<Discount>()
            .Where(d => d.Id == id)
            .ExecuteUpdateAsync(
                d => d.SetProperty(x => x.IsActive, x => !x.IsActive),
                cancellationToken) > 0;
    }

    public async Task<bool> DeleteDiscountAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await _context.Set<Discount>()
            .Where(d => d.Id == id)
            .ExecuteDeleteAsync(cancellationToken) > 0;
    }

    public async Task<bool> IsDiscountExistedAsync(
        Guid id,
        string code,
        CancellationToken cancellationToken = default)
    {
        return await _context.Set<Discount>()
            .AnyAsync(d =>
                d.Id != id &&
                d.Code.ToLower() == code.ToLower(),
                cancellationToken);
    }

}
