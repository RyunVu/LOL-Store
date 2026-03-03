using System.Linq.Expressions;
using LoLStore.Core.Constants;
using LoLStore.Core.Entities;
using LoLStore.Core.Queries;
using LoLStore.Data.Contexts;
using LoLStore.Services.Extensions;
using Microsoft.EntityFrameworkCore;

namespace LoLStore.Services.Shop;

public class ProductRepository : IProductRepository
{
    private readonly StoreDbContext _context;

    public ProductRepository(StoreDbContext context)
    {
        _context = context;
    }

    #region Products - Read Operations


    private static Expression<Func<Product, bool>> IsPublicVisible()
    {
        return p =>
            p.IsActive &&
            !p.IsDeleted &&
            p.Categories.Any(c =>
                !c.IsDeleted &&
                c.IsActive
            );
    }

    public async Task<Product?> GetProductByIdAsync(
        Guid productId,
        bool getAll = false,
        CancellationToken cancellationToken = default)
    {
        IQueryable<Product> query = _context.Set<Product>();

        if (getAll)
        {
            query = query
                .Include(p => p.Categories)
                .Include(p => p.Supplier)
                .Include(p => p.Feedback)
                .Include(p => p.Pictures);
        }
        else
        {
            query = query
                .Include(p => p.Pictures)
                .Include(p => p.Categories);
        }

        return await query.FirstOrDefaultAsync(p => p.Id == productId, cancellationToken);
    }

    public async Task<Product?> GetProductBySlugAsync(
        string slug,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(slug))
        {
            return null;
        }

        return await _context.Set<Product>()
            .AsNoTracking()
            .Include(p => p.Categories)
            .Include(p => p.Pictures)
            .Include(p => p.Supplier)
            .Where(IsPublicVisible())
            .FirstOrDefaultAsync(p => p.UrlSlug == slug, cancellationToken);
    }

    public Task<IPagedList<Product>> GetPagedProductsAsync(
        ProductQuery query,
        IPagingParams pagingParams,
        CancellationToken cancellationToken = default)
    {
        var products = FilterProducts(query);
        
        products = ApplyDateFiltering(products, query);

        return products.ToPagedListAsync(pagingParams, cancellationToken);
    }

    public Task<IPagedList<T>> GetPagedProductsAsync<T>(
        ProductQuery query,
        IPagingParams pagingParams,
        Func<IQueryable<Product>, IQueryable<T>> mapper,
        CancellationToken cancellationToken = default)
    {
        var products = FilterProducts(query);
        products = ApplyDateFiltering(products, query);

        return mapper(products)
            .ToPagedListAsync(pagingParams, cancellationToken);
    }

    public Task<IPagedList<T>> GetPagedProductsForUserAsync<T>(
        ProductQuery query,
        IPagingParams pagingParams,
        Func<IQueryable<Product>, IQueryable<T>> mapper,
        CancellationToken cancellationToken = default)
    {
        // Public-facing constraints
        query.IsActive = true;
        query.IsDeleted = false;

        var products = FilterProducts(query);

        return mapper(products)
            .ToPagedListAsync(pagingParams, cancellationToken);
    }

    public async Task<IList<Product>> GetMostSaledProductsAsync(
        int numberOfProducts,
        CancellationToken cancellationToken = default)
    {
        return await _context.Set<Product>()
            .AsNoTracking()
            .Where(IsPublicVisible())
            .Where(p => p.Quantity > 0 && p.IsActive)
            .OrderByDescending(p => p.CountOrder)
            .Take(numberOfProducts)
            .ToListAsync(cancellationToken);
    }

    public async Task<IList<Product>> GetRelatedProductsAsync(
        string slug,
        int num = 10,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(slug))
            return new List<Product>();

        return await _context.Set<Product>()
            .AsNoTracking()
            // .Include(p => p.Pictures)
            // .Include(p => p.Categories)
            .Where(IsPublicVisible())
            .Where(p => p.UrlSlug != slug)
            .Where(p => p.Categories.Any(c =>
                c.Products.Any(cp => cp.UrlSlug == slug)))
            .OrderByDescending(p => p.CountOrder)
            .Take(num)
            .ToListAsync(cancellationToken);
    }

    #endregion

    #region Products - Write Operations

    public async Task<Product> AddAsync(
        Product product,
        CancellationToken cancellationToken = default)
    {
        _context.Set<Product>().Add(product);
        await _context.SaveChangesAsync(cancellationToken);
        return product;
    }

    public async Task<bool> UpdateAsync(
        Product product,
        CancellationToken cancellationToken = default)
    {
        _context.Entry(product).State = EntityState.Modified;
        return await _context.SaveChangesAsync(cancellationToken) > 0;
    }

    public async Task<bool> SaveChangesAsync(
        CancellationToken cancellationToken = default)
    {
        return await _context.SaveChangesAsync(cancellationToken) > 0;
    }

    public async Task<Product?> SetProductCategoriesAsync(
        Product product,
        IEnumerable<Guid> categoryIds,
        CancellationToken cancellationToken = default)
    {
        if (product == null)
            return null;

        UpdateProductCategories(product, categoryIds);

        await _context.SaveChangesAsync(cancellationToken);

        return product;
    }

    private void UpdateProductCategories(Product product, IEnumerable<Guid> categoryIds)
    {
        var selectedIds = new HashSet<Guid>(categoryIds);
        var currentIds = product.Categories.Select(c => c.Id).ToHashSet();

        // Remove
        foreach (var category in product.Categories
                     .Where(c => !selectedIds.Contains(c.Id))
                     .ToList())
        {
            product.Categories.Remove(category);
        }

        // Add
        var categoriesToAdd = selectedIds.Except(currentIds).ToList();
        if (categoriesToAdd.Any())
        {
            var newCategories = _context.Set<Category>()
                .Where(c => categoriesToAdd.Contains(c.Id))
                .ToList();

            foreach (var category in newCategories)
                product.Categories.Add(category);
        }
    }

    public async Task<bool> DeleteProductAsync(
        Guid productId,
        CancellationToken cancellationToken = default)
    {
        return await _context.Set<Product>()
            .Where(p => p.Id == productId)
            .ExecuteDeleteAsync(cancellationToken) > 0;
    }

    #endregion

    #region Products - Validation Operations

    public async Task<bool> IsProductSlugExistedAsync(
        string slug,
        Guid? excludeProductId = null,
        CancellationToken cancellationToken = default)
    {
        return await _context.Set<Product>()
            .AnyAsync(
                p => p.UrlSlug == slug &&
                     (!excludeProductId.HasValue || p.Id != excludeProductId),
                cancellationToken);
    }

    public async Task<bool> IsProductNameExistedAsync(
        string name,
        Guid? excludeProductId = null,
        CancellationToken cancellationToken = default)
    {
        return await _context.Set<Product>()
            .AnyAsync(
                p => p.Name == name &&
                     (!excludeProductId.HasValue || p.Id != excludeProductId),
                cancellationToken);
    }

    public async Task<bool> HasOrdersAsync(
        Guid productId,
        CancellationToken cancellationToken = default)
    {
        return await _context.Set<OrderDetail>()
            .AsNoTracking()
            .AnyAsync(
                od => od.ProductId == productId,
                cancellationToken);
    }

    #endregion

    #region Products - Toggle Operations

    public async Task<bool> ToggleActiveProductAsync(
        Guid productId,
        CancellationToken cancellationToken = default)
    {
        var product = await _context.Set<Product>()
            .FirstOrDefaultAsync(p => p.Id == productId, cancellationToken);

        if (product == null)
            return false;

        product.IsActive = !product.IsActive;
        product.UpdatedAt = DateTime.UtcNow;

        return await _context.SaveChangesAsync(cancellationToken) > 0;
    }

    public async Task<bool> ToggleDeleteProductAsync(
        Guid productId,
        CancellationToken cancellationToken = default)
    {
        var product = await _context.Set<Product>()
            .FirstOrDefaultAsync(p => p.Id == productId, cancellationToken);

        if (product == null)
            return false;

        product.IsDeleted = !product.IsDeleted;
        product.UpdatedAt = DateTime.UtcNow;

        if (product.IsDeleted)
        {
            product.IsActive = false;
            product.DeletedAt = DateTime.UtcNow;
        }
        else
        {
            product.DeletedAt = null;
        }

        return await _context.SaveChangesAsync(cancellationToken) > 0;
    }

    #endregion

    #region Product Pictures

    public async Task<bool> SetImageUrlAsync(
        Guid productId,
        string imageUrl,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(imageUrl))
        {
            return false;
        }

        var productExisted = await _context.Set<Product>()
            .AsNoTracking()
            .AnyAsync(p => p.Id == productId, cancellationToken);

        if (!productExisted)
        {
            return false;
        }

        _context.Set<Picture>().Add(new Picture
        {
            Id = Guid.NewGuid(),
            ProductId = productId,
            Path = imageUrl.Trim(),
            IsActive = true
        });

        return await _context.SaveChangesAsync(cancellationToken) > 0;
    }

    public async Task<IList<Picture>> GetImageUrlsAsync(
        Guid productId,
        CancellationToken cancellationToken = default)
    {
        return await _context.Set<Picture>()
            .AsNoTracking()
            .Where(p => p.ProductId == productId && p.IsActive)
            .ToListAsync(cancellationToken);
    }

    public async Task<bool> DeleteImageUrlsAsync(
        Guid productId,
        CancellationToken cancellationToken = default)
    {
        var deletedCount = await _context.Set<Picture>()
            .Where(p => p.ProductId == productId)
            .ExecuteDeleteAsync(cancellationToken);

        return deletedCount > 0;
    }

    #endregion

    #region Product Histories

    public Task<IPagedList<T>> GetPagedProductHistoriesAsync<T>(
        ProductHistoryQuery query,
        IPagingParams pagingParams,
        Func<IQueryable<ProductHistory>, IQueryable<T>> mapper,
        CancellationToken cancellationToken = default)
    {
        return mapper(FilterProductHistories(query))
            .ToPagedListAsync(pagingParams, cancellationToken);
    }

    private IQueryable<ProductHistory> FilterProductHistories(ProductHistoryQuery query)
    {
        var histories = _context.Set<ProductHistory>()
            .AsNoTracking()
            .Include(h => h.Product)
            .Include(h => h.User)
            .AsQueryable();

        histories = histories
            .WhereIf(query.UserId.HasValue,
                h => h.UserId == query.UserId!.Value)

            .WhereIf(query.ProductId.HasValue,
                h => h.ProductId == query.ProductId!.Value)

            .WhereIf(query.Action.HasValue,
                h => h.HistoryAction == query.Action!.Value)

            .WhereIf(query.Year.HasValue,
                h => h.ActionTime.Year == query.Year!.Value)

            .WhereIf(query.Month.HasValue,
                h => h.ActionTime.Month == query.Month!.Value)

            .WhereIf(query.Day.HasValue,
                h => h.ActionTime.Day == query.Day!.Value)

            .WhereIf(!string.IsNullOrWhiteSpace(query.Keyword),
                h =>
                    (h.EditReason ?? string.Empty).Contains(query.Keyword!) ||
                    h.Product.Name.Contains(query.Keyword!) ||
                    h.User.Name.Contains(query.Keyword!));

        return histories;
    }

    public async Task<bool> DeleteProductHistoryAsync(
        Guid productHistoryId,
        CancellationToken cancellationToken = default)
    {
        return await _context.Set<ProductHistory>()
            .Where(ph => ph.Id == productHistoryId)
            .ExecuteDeleteAsync(cancellationToken) > 0;
    }

    public async Task<bool> DeleteProductHistoriesAsync(
        IList<Guid> historyIds,
        CancellationToken cancellationToken = default)
    {
        if (historyIds == null)
            return false;

        var ids = historyIds
            .Where(id => id != Guid.Empty)
            .Distinct()
            .ToList();

        if (ids.Count == 0)
            return false;

        var deletedCount = await _context.Set<ProductHistory>()
            .Where(ph => ids.Contains(ph.Id))
            .ExecuteDeleteAsync(cancellationToken);

        return deletedCount > 0;
    }

    public async Task<bool> AddProductHistoryAsync(
        ProductHistory history,
        CancellationToken cancellationToken = default)
    {
        _context.Set<ProductHistory>().Add(history);
        return await _context.SaveChangesAsync(cancellationToken) > 0;
    }

    #endregion

    #region Private Helpers

    private IQueryable<Product> FilterProducts(ProductQuery query)
    {
        var products = _context.Set<Product>()
            .AsNoTracking()
            .AsSplitQuery()
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(query.Keyword))
        {
            var keyword = query.Keyword.Trim();
            products = products.Where(p =>
                EF.Functions.Like(p.Name, $"%{keyword}%") ||
                EF.Functions.Like(p.Sku, $"%{keyword}%") ||
                EF.Functions.Like(p.UrlSlug, $"%{keyword}%") ||
                EF.Functions.Like(p.Description ?? "", $"%{keyword}%"));
        }

        if (!string.IsNullOrWhiteSpace(query.CategorySlug))
        {
            products = products.Where(p =>
                p.Categories.Any(c => c.UrlSlug == query.CategorySlug));
        }

        if (query.IsActive.HasValue)
        {
            products = products.Where(p => p.IsActive == query.IsActive.Value);
        }

        if (query.IsDeleted.HasValue)
        {
            products = products.Where(p => p.IsDeleted == query.IsDeleted.Value);
        }

        if (query.IsPublished == true)
        {
            products = products.Where(IsPublicVisible());
        }

        if (query.CategoryId.HasValue)
        {
            products = products.Where(p =>
                p.Categories.Any(c =>
                    c.Id == query.CategoryId &&
                    !c.IsDeleted &&
                    c.IsActive));
        }

        if (query.MinPrice.HasValue)
        {
            products = products.Where(p =>
                EF.Property<decimal>(p, "DiscountedPrice") >= query.MinPrice.Value);
        }

        if (query.MaxPrice.HasValue)
        {
            products = products.Where(p =>
                EF.Property<decimal>(p, "DiscountedPrice") <= query.MaxPrice.Value);
        }

        return products;
    }

    private IQueryable<Product> ApplyDateFiltering(
        IQueryable<Product> products,
        ProductQuery query)
    {
        if (!query.DateFilter.HasValue)
        {
            return products;
        }

        var isAsc = query.SortOrder == SortOrder.Asc;

        return query.DateFilter.Value switch
        {
            DateFilterType.Created => isAsc
                ? products.OrderBy(c => c.CreatedAt)
                : products.OrderByDescending(c => c.CreatedAt),

            DateFilterType.Updated => isAsc
                ? products.OrderBy(c => c.UpdatedAt ?? DateTime.MinValue)
                : products.OrderByDescending(c => c.UpdatedAt ?? DateTime.MinValue),

            DateFilterType.Deleted => isAsc
                ? products.OrderBy(c => c.DeletedAt ?? DateTime.MinValue)
                : products.OrderByDescending(c => c.DeletedAt ?? DateTime.MinValue),

            _ => products
        };
    }

    #endregion
}