using LoLStore.Core.Constants;
using LoLStore.Core.Entities;
using LoLStore.Core.Queries;
using LoLStore.Data.Contexts;
using LoLStore.Services.Extensions;
using Microsoft.EntityFrameworkCore;

namespace LoLStore.Services.Shop.Discounts;

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
        Func<IQueryable<Discount>, IQueryable<T>> mapper,
        CancellationToken ct = default)
    {
        var discounts = FilterDiscount(query);
        
        if (query.Status.HasValue)
        {
            discounts = ApplyStatusFiltering(discounts, query);
        }
        
        if (query.DateFilter.HasValue)
        {
            discounts = ApplyDateFiltering(discounts, query);
        }

        return await mapper(discounts)
            .ToPagedListAsync(pagingParams, ct);
    }

    public async Task<IPagedList<T>> GetPagedDiscountForUserAsync<T>(
        DiscountQuery query, 
        IPagingParams pagingParams, 
        Func<IQueryable<Discount>, IQueryable<T>> mapper,
        CancellationToken ct = default)
    {
        query.IsActive = true;
        query.IsDeleted = false;
        
        var discounts = FilterDiscount(query);

        return await mapper(discounts)
            .ToPagedListAsync(pagingParams, ct);
    }

    private IQueryable<Discount> FilterDiscount(DiscountQuery query)
    {
        var discounts = _context.Set<Discount>()
            .AsNoTracking()
            .Include(d => d.Orders)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(query.Code))
        {
            query.Code = query.Code.Trim().ToUpper();
            discounts = discounts.Where(d => d.Code.Contains(query.Code));
        }

        if (query.IsDeleted.HasValue)
        {
            discounts = discounts.Where(d => d.IsDeleted == query.IsDeleted.Value);
        }

        if (query.IsPercentage.HasValue)
        {
            discounts = discounts.Where(d => d.IsPercentage == query.IsPercentage.Value);
        }

        if (query.DiscountValue.HasValue)
        {
            discounts = discounts.Where(d => d.DiscountValue == query.DiscountValue.Value);
        }

        if (query.MinimunOrderAmount.HasValue)
        {
            discounts = discounts.Where(d => d.MinimunOrderAmount >= query.MinimunOrderAmount.Value);
        }

        if (query.IsActive.HasValue)
        {
            discounts = discounts.Where(d => d.IsActive == query.IsActive.Value);
        }

        if (query.StartDate.HasValue)
        {
            discounts = discounts.Where(d => d.StartDate >= query.StartDate.Value);
        }

        if (query.EndDate.HasValue)
        {
            discounts = discounts.Where(d => d.EndDate <= query.EndDate.Value);
        }

        if (query.ValidNow.HasValue && query.ValidNow.Value)
        {
            var now = DateTime.UtcNow;
            discounts = discounts.Where(d =>
                d.StartDate <= now &&
                d.EndDate >= now &&
                (d.MaxUses == null || d.TimesUsed < d.MaxUses));
        }

        return discounts;
        // return _context.Set<Discount>()
        //     .WhereIf(query.IsActive == true,
        //         d => d.IsActive &&
        //              d.StartDate <= now &&
        //              d.EndDate >= now &&
        //              (d.MaxUses == null || d.TimesUsed < d.MaxUses))
        //     .WhereIf(query.Day.HasValue,
        //         d => d.CreatedAt.Day == query.Day)
        //     .WhereIf(query.Month.HasValue,
        //         d => d.CreatedAt.Month == query.Month)
        //     .WhereIf(query.Year.HasValue,
        //         d => d.CreatedAt.Year == query.Year);
    }

    // Queries
    public async Task<Discount?> GetByIdAsync(
        Guid id,
        CancellationToken ct = default)
    {
        return await _context.Discounts
            .FirstOrDefaultAsync(
                d => d.Id == id,
                ct);
    }

    public async Task<Discount?> GetByCodeAsync(
        string code,
        CancellationToken ct = default)
    {
        var normalizedCode = code.Trim().ToUpper();

        return await _context.Set<Discount>()
            .AsNoTracking()
            .FirstOrDefaultAsync(
                d => d.Code == normalizedCode &&
                    !d.IsDeleted,
                ct);
    }

    public async Task AddAsync(Discount discount, CancellationToken ct = default)
    {
        await _context.Discounts.AddAsync(discount, ct);
        await _context.SaveChangesAsync(ct);
    }

    public async Task SaveChangesAsync(CancellationToken ct = default)
    {
        await _context.SaveChangesAsync(ct);
    }

    public async Task<bool> DeletePermanentlyAsync(Discount discount, CancellationToken ct = default)
    {
        return await _context.Discounts
            .Where(d => d.Id == discount.Id)
            .ExecuteDeleteAsync(ct) > 0;
    }

    public async Task<bool> IsDiscountExistedAsync(string code, CancellationToken ct = default)
    {
        var normalizedCode = code.Trim().ToUpper();

        return await _context.Set<Discount>()
            .AnyAsync(d =>
                !d.IsDeleted &&
                d.Code == normalizedCode,
                ct);
    }

    private IQueryable<Discount> ApplyDateFiltering(
        IQueryable<Discount> discounts,
        DiscountQuery query)
    {
        if (!query.DateFilter.HasValue)
        {
            return discounts;
        }

        var isAsc = query.SortOrder == SortOrder.Asc;

        return query.DateFilter.Value switch
        {
            DateFilterType.Created => isAsc
                ? discounts.OrderBy(c => c.CreatedAt)
                : discounts.OrderByDescending(c => c.CreatedAt),

            DateFilterType.Updated => isAsc
                ? discounts.OrderBy(c => c.UpdatedAt ?? DateTime.MinValue)
                : discounts.OrderByDescending(c => c.UpdatedAt ?? DateTime.MinValue),

            DateFilterType.Deleted => isAsc
                ? discounts.OrderBy(c => c.DeletedAt ?? DateTime.MinValue)
                : discounts.OrderByDescending(c => c.DeletedAt ?? DateTime.MinValue),

            _ => discounts
        };
    }

    private IQueryable<Discount> ApplyStatusFiltering(
        IQueryable<Discount> discounts,
        DiscountQuery query)
    {
        if (!query.Status.HasValue)
        {
            return discounts;
        }

        var isAsc = query.SortOrder == SortOrder.Asc;

        return query.Status.Value switch
        {
            DiscountStatus.Active => isAsc
                ? discounts.Where(d => d.IsActive && d.StartDate <= DateTime.UtcNow && d.EndDate >= DateTime.UtcNow)
                : discounts.Where(d => d.IsActive && d.StartDate <= DateTime.UtcNow && d.EndDate >= DateTime.UtcNow).OrderByDescending(d => d.CreatedAt),

            DiscountStatus.Inactive => isAsc
                ? discounts.Where(d => !d.IsActive)
                : discounts.Where(d => !d.IsActive).OrderByDescending(d => d.CreatedAt),

            DiscountStatus.Scheduled => isAsc
                ? discounts.Where(d => !d.IsActive && d.StartDate > DateTime.UtcNow)
                : discounts.Where(d => !d.IsActive && d.StartDate > DateTime.UtcNow).OrderByDescending(d => d.CreatedAt),

            DiscountStatus.Expired => isAsc
                ? discounts.Where(d => !d.IsActive && d.EndDate < DateTime.UtcNow)
                : discounts.Where(d => !d.IsActive && d.EndDate < DateTime.UtcNow).OrderByDescending(d => d.CreatedAt),

            _ => discounts
        };
    }
}
