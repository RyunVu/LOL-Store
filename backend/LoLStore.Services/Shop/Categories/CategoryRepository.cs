using System.Linq.Dynamic.Core;
using LoLStore.Core.Constants;
using LoLStore.Core.DTO.Categories;
using LoLStore.Core.Entities;
using LoLStore.Core.Queries;
using LoLStore.Data.Contexts;
using LoLStore.Services.Extensions;
using Microsoft.EntityFrameworkCore;

namespace LoLStore.Services.Shop.Categories;

public class CategoryRepository : ICategoryRepository
{
    private readonly StoreDbContext _context;

    public CategoryRepository(StoreDbContext context)
    {
        _context = context;
    }

    // =======================
    // Queries (READ)
    // =======================

    public async Task<IPagedList<T>> GetPagedCategoriesAsync<T>(
        CategoryQuery query,
        IPagingParams pagingParams,
        Func<IQueryable<Category>, IQueryable<T>> mapper,
        CancellationToken cancellationToken = default)
    {
        var categories = FilterCategories(query);
        
        categories = ApplyDateFiltering(categories, query);

        return await mapper(categories)
            .ToPagedListAsync(pagingParams, cancellationToken);
    }

    public async Task<IPagedList<T>> GetPagedCategoriesForUserAsync<T>(
        CategoryQuery query,
        IPagingParams pagingParams,
        Func<IQueryable<Category>, IQueryable<T>> mapper,
        CancellationToken cancellationToken = default)
    {
        // Public-facing constraints
        query.IsActive = true;
        query.IsDeleted = false;

        var categories = FilterCategories(query);

        return await mapper(categories)
            .ToPagedListAsync(pagingParams, cancellationToken);
    }

    public async Task<Category?> GetByIdAsync(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        return await _context.Categories
            .FirstOrDefaultAsync(c => c.Id == id, cancellationToken);
    }

    public async Task<Category?> GetActiveBySlugAsync(
        string slug,
        CancellationToken cancellationToken = default)
    {
        return await _context.Categories
            .FirstOrDefaultAsync(
                c => c.UrlSlug == slug && c.IsActive && !c.IsDeleted,
                cancellationToken);
    }
    
    public async Task<IList<RelatedCategoryDto>> GetRelatedCategoriesBySlugAsync(
        CategoryQuery query,
        CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(query.UrlSlug))
        {
            return new List<RelatedCategoryDto>();
        }

        var related = _context.Products
            .AsNoTracking()
            .Where(p => !p.IsDeleted && p.Active)
            .Where(p => p.Categories.Any(c =>
                c.UrlSlug == query.UrlSlug && !c.IsDeleted))
            .SelectMany(p => p.Categories)
            .Where(c => !c.IsDeleted && c.UrlSlug != query.UrlSlug)
            .GroupBy(c => new { c.Id, c.Name, c.UrlSlug })
            .Select(g => new RelatedCategoryDto
            {
                Id = g.Key.Id,
                Name = g.Key.Name,
                UrlSlug = g.Key.UrlSlug,
                ProductCount = g.Count()
            })
            .Take(10);

        return await related.ToListAsync(ct);
    }

    // =======================
    // Writes (COMMAND)
    // =======================

    public async Task AddAsync(
        Category category,
        CancellationToken cancellationToken = default)
    {
        await _context.Categories.AddAsync(category, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);
    }

    public async Task SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        await _context.SaveChangesAsync(cancellationToken);
    }

    public async Task<bool> DeletePermanentlyAsync(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        return await _context.Categories
            .Where(c => c.Id == id)
            .ExecuteDeleteAsync(cancellationToken) > 0;
    }

    // =======================
    // Validation helpers
    // =======================

    public async Task<bool> ExistsBySlugAsync(
        string slug,
        Guid? excludeId,
        CancellationToken cancellationToken = default)
    {
        return await _context.Categories.AnyAsync(
            c => c.UrlSlug == slug &&
                 (!excludeId.HasValue || c.Id != excludeId),
            cancellationToken);
    }

    public async Task<bool> HasProductsAsync(
        Guid categoryId,
        CancellationToken cancellationToken = default)
    {
        return await _context.Products
            .AsNoTracking()
            .AnyAsync(
                p => !p.IsDeleted &&
                    p.Categories.Any(c => c.Id == categoryId),
                cancellationToken);
    }


    // =======================
    // Private helpers
    // =======================

    private IQueryable<Category> FilterCategories(CategoryQuery query)
    {
        var categories = _context.Categories
            .AsNoTracking()
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(query.Keyword))
        {
            var keyword = query.Keyword.Trim();
            categories = categories.Where(c =>
                c.Name.Contains(keyword) ||
                (c.Description ?? string.Empty).Contains(keyword));
        }

        if (!string.IsNullOrWhiteSpace(query.UrlSlug))
        {
            categories = categories.Where(c => c.UrlSlug == query.UrlSlug);
        }

        if (query.IsActive.HasValue)
        {
            categories = categories.Where(c => c.IsActive == query.IsActive.Value);
        }

        if (query.IsDeleted.HasValue)
        {
            categories = categories.Where(c => c.IsDeleted == query.IsDeleted.Value);
        }

        return categories;
    }

    private IQueryable<Category> ApplyDateFiltering(
        IQueryable<Category> categories,
        CategoryQuery query)
    {
        if (!query.DateFilter.HasValue)
        {
            return categories;
        }

        var isAsc = query.SortOrder == SortOrder.Asc;

        return query.DateFilter.Value switch
        {
            DateFilterType.Created => isAsc
                ? categories.OrderBy(c => c.CreatedAt)
                : categories.OrderByDescending(c => c.CreatedAt),

            DateFilterType.Updated => isAsc
                ? categories.OrderBy(c => c.UpdatedAt ?? DateTime.MinValue)
                : categories.OrderByDescending(c => c.UpdatedAt ?? DateTime.MinValue),

            DateFilterType.Deleted => isAsc
                ? categories.OrderBy(c => c.DeletedAt ?? DateTime.MinValue)
                : categories.OrderByDescending(c => c.DeletedAt ?? DateTime.MinValue),

            _ => categories
        };
    }

    public async Task<Category?> GetBySlugAsync(
        string slug,
        CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(slug))
        {
            return null;
        }

        return await _context.Categories
            .FirstOrDefaultAsync(c => c.UrlSlug == slug, ct);
    }

}
