using System.Linq.Dynamic.Core;
using LoLStore.Core.DTO;
using LoLStore.Core.Entities;
using LoLStore.Core.Queries;
using LoLStore.Data.Contexts;
using LoLStore.Services.Extensions;
using Microsoft.EntityFrameworkCore;

namespace LoLStore.Services.Shop;

public class CategoryRepository : ICategoryRepository
{
    private readonly StoreDbContext _context;

    public CategoryRepository(StoreDbContext context)
    {
        _context = context;
    }

    public Task<IPagedList<Category>> SearchCategoriesAsync(string keyword, IPagingParams pagingParams, CancellationToken cancellationToken = default)
    {
        var categories = _context.Categories
            .AsNoTracking()
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(keyword))
        {
        var key = keyword.Trim();


        categories = categories.Where(c =>
        c.Name.Contains(key) ||
        (c.Description ?? string.Empty).Contains(key) ||
        (c.UrlSlug ?? string.Empty).Contains(key));
        }

        return categories.ToPagedListAsync(pagingParams, cancellationToken);
    }

    public async Task<IPagedList<T>> GetPagedCategoriesAsync<T>(CategoryQuery query, IPagingParams pagingParams, Func<IQueryable<Category>, IQueryable<T>> mapper,CancellationToken cancellationToken = default)
    {
        var categories = _context.Categories
            .AsNoTracking()
            .AsQueryable();

        categories = categories
            .WhereIf(query.ShowOnMenu.HasValue,
                c => c.ShowOnMenu == query.ShowOnMenu)
            .WhereIf(query.IsDeleted.HasValue,
                c => c.IsDeleted == query.IsDeleted)
            .WhereIf(!string.IsNullOrWhiteSpace(query.Keyword), c =>
                c.Name.Contains(query.Keyword!.Trim()) ||
                (c.Description ?? string.Empty).Contains(query.Keyword!.Trim()) ||
                (c.UrlSlug ?? string.Empty).Contains(query.Keyword!.Trim())
            );

        var mappedCategories = mapper(categories);
        
		return await mappedCategories.ToPagedListAsync(pagingParams, cancellationToken);
    }


    public async Task<IPagedList<T>> GetPagedCategoriesForUserAsync<T>(CategoryQuery query, IPagingParams pagingParams, Func<IQueryable<Category>, IQueryable<T>> mapper, CancellationToken cancellationToken = default)
    {
        var categories = _context.Categories
            .AsNoTracking()
            .Where(c => !c.IsDeleted)
            .AsQueryable();

        categories = categories
            .WhereIf(query.ShowOnMenu.HasValue,
                c => c.ShowOnMenu == query.ShowOnMenu)
            .WhereIf(!string.IsNullOrWhiteSpace(query.Keyword), c =>
                c.Name.Contains(query.Keyword!.Trim()) ||
                (c.Description ?? string.Empty).Contains(query.Keyword!.Trim()) ||
                (c.UrlSlug ?? string.Empty).Contains(query.Keyword!.Trim())
            );
        var mappedCategories = mapper(categories);

        return await mappedCategories.ToPagedListAsync(pagingParams, cancellationToken);
    }

    public async Task<IList<CategoryItem>> GetRelatedCategoriesBySlugAsync(CategoryQuery query, CancellationToken cancellationToken = default)
    {
        // Filter products that are active and not deleted
        var relatedCategoriesQuery = _context.Products
            .AsNoTracking()
            .Where(c => !c.IsDeleted && c.Active)
            // Only include the products that belong to the specified Category UrlSlug 
            .WhereIf(!string.IsNullOrWhiteSpace(query.UrlSlug),
                p => p.Categories.Any(c => c.UrlSlug == query.UrlSlug && !c.IsDeleted))
            // Only include the products matching keyword (if provided)
            .WhereIf(!string.IsNullOrWhiteSpace(query.Keyword), p =>
                p.Name.Contains(query.Keyword!.Trim()) ||
                (p.Description ?? string.Empty).Contains(query.Keyword!.Trim()) ||
                (p.Sku ?? string.Empty).Contains(query.Keyword!.Trim()) ||
                (p.UrlSlug ?? string.Empty).Contains(query.Keyword!.Trim()))
            // Flatten to categories
            .SelectMany(p => p.Categories)
            // Exclude the main category itself and the deleted categories
            .Where(c => !c.IsDeleted && c.UrlSlug != query.UrlSlug)
            .GroupBy(c => new { c.Id, c.Name, c.UrlSlug })
            .Select(group => new CategoryItem()
            {
                Id = group.Key.Id,
                Name = group.Key.Name,
                UrlSlug = group.Key.UrlSlug,
                ProductCount = group.Count()
            });
        return await relatedCategoriesQuery.ToListAsync(cancellationToken);
    }

    public async Task<Category?> GetCategoryBySlugAsync(string slug, bool isUser = false, CancellationToken cancellationToken = default)
    {
        if (isUser)
        {
            return await _context.Set<Category>()
                .FirstOrDefaultAsync(c => c.UrlSlug == slug && !c.IsDeleted, cancellationToken);
        }

        return await _context.Set<Category>()
            .FirstOrDefaultAsync(c => c.UrlSlug == slug, cancellationToken);
    }

    public async Task<Category> AddOrUpdateCategoryAsync(Category category, CancellationToken cancellationToken = default)
    {
        category.UrlSlug = category.Name.GenerateSlug();
        if (_context.Set<Category>().Any(c => c.Id == category.Id))
        {
            _context.Entry(category).State = EntityState.Modified;
        }
        else
        {
            _context.Categories.Add(category);
        }

        await _context.SaveChangesAsync(cancellationToken);
        return category;
    }

    public async Task<bool> SoftDeleteToggleCategoryAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var category = await GetCategoryByIdAsync(id, cancellationToken);
        if (category == null) return false;

        category.ShowOnMenu = false;

        category.IsDeleted = !category.IsDeleted;

        _context.Entry(category).State = EntityState.Modified;
        await _context.SaveChangesAsync(cancellationToken);

        return true;
    }

    public async Task<bool> HardDeleteCategoryAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await _context.Set<Category>()
            .Where(c => c.Id == id)
            .ExecuteDeleteAsync(cancellationToken) > 0;
    }
    
    public async Task<bool> ToggleShowOnMenuAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await _context.Set<Category>()
            .Where(c => c.Id == id)
            .ExecuteUpdateAsync(c => c.SetProperty(c => c.ShowOnMenu, c => !c.ShowOnMenu), cancellationToken) > 0;
    }

    public async Task<bool> IsCategoryNameExistedAsync(string name, Guid? excludeId, CancellationToken cancellationToken = default)
    {
        var slug = name.GenerateSlug(); 

        return await _context.Set<Category>()
            .AnyAsync(c => c.Id != excludeId && c.UrlSlug.Equals(slug), cancellationToken);
    }

    public Task<Category?> GetCategoryByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return _context.Set<Category>()
            .FirstOrDefaultAsync(c => c.Id == id, cancellationToken);
    }

}