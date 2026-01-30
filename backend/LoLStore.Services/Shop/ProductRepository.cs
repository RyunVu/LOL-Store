using System.Linq.Expressions;
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

    #region Products
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
            query = query.Include(p => p.Pictures)
                        .Include(p => p.Categories);
        }

        return await query.FirstOrDefaultAsync(p => p.Id == productId, cancellationToken);
    }

    public async Task<Product?> GetProductBySlugAsync(
        string slug,
        CancellationToken cancellationToken = default)
    {
        return await _context.Set<Product>()
            .AsNoTracking()
            .Include(p => p.Categories)
            .Include(p => p.Pictures)
            .Include(p => p.Supplier)
            .Where(IsPublicVisible())
            .FirstOrDefaultAsync(p => p.UrlSlug == slug, cancellationToken);
    }

    public async Task<bool> IsProductSlugExistedAsync(
        string slug,
        Guid? excludeProductId = null,
        CancellationToken cancellationToken = default)
    {
        return await _context.Set<Product>()
            .AnyAsync(p => p.Id != excludeProductId && p.UrlSlug == slug, cancellationToken);
    }

    public async Task<bool> IsProductNameExistedAsync(
        string name,
        Guid? excludeProductId = null,
        CancellationToken cancellationToken = default)
    {
        return await _context.Set<Product>()
            .AnyAsync(p => p.Id != excludeProductId && p.Name == name, cancellationToken);
    }

    public async Task<Product> AddOrUpdateProductAsync(
        Product product,
        Guid userId,
        string editReason = "",
        CancellationToken cancellationToken = default)
    {
        var slug = product.Name.GenerateSlug();

        if (await IsProductSlugExistedAsync(slug, product.Id, cancellationToken))
        {
            throw new InvalidOperationException($"Product slug `{slug}` already exists.");
        }

        product.UrlSlug = slug;

        var isNew = !_context.Set<Product>().Any(p => p.Id == product.Id);

        if (isNew)
            _context.Set<Product>().Add(product);
        else
            _context.Entry(product).State = EntityState.Modified;

        await _context.SaveChangesAsync(cancellationToken);

        _context.Set<ProductHistory>().Add(new ProductHistory
        {
            ProductId = product.Id,
            UserId = userId,
            HistoryAction = isNew
                ? ProductHistoryAction.Create
                : ProductHistoryAction.Update,
            EditReason = editReason,
            ActionTime = DateTime.UtcNow
        });

        await _context.SaveChangesAsync(cancellationToken);

        return product;
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

    public Task<IPagedList<Product>> GetPagedProductsAsync(
        ProductQuery query,
        IPagingParams pagingParams,
        CancellationToken cancellationToken = default)
    {
        return FilterProducts(query)
            .ToPagedListAsync(pagingParams, cancellationToken);
    }

    public Task<IPagedList<T>> GetPagedProductsAsync<T>(
        ProductQuery query,
        IPagingParams pagingParams,
        Func<IQueryable<Product>, IQueryable<T>> mapper,
        CancellationToken cancellationToken = default)
    {
        return mapper(FilterProducts(query))
            .ToPagedListAsync(pagingParams, cancellationToken);
    }

    private IQueryable<Product> FilterProducts(ProductQuery query)
    {
        var products = _context.Set<Product>()
            .AsNoTracking()
            .Include(p => p.OrderItems)
            .Include(p => p.Pictures)
            .Include(p => p.Categories)
            .AsQueryable();

        products = products
            .WhereIf(query.Active.HasValue,
                p => p.IsActive == query.Active!.Value)

            .WhereIf(query.IsDeleted.HasValue,
                p => p.IsDeleted == query.IsDeleted!.Value)

            .WhereIf(query.IsPublished == true, IsPublicVisible())

            .WhereIf(query.Year.HasValue,
                p => p.CreateDate.Year == query.Year!.Value)

            .WhereIf(query.Month.HasValue,
                p => p.CreateDate.Month == query.Month!.Value)

            .WhereIf(query.Day.HasValue,
                p => p.CreateDate.Day == query.Day!.Value)

            .WhereIf(query.MinPrice.HasValue,
                p =>
                    (p.Price - (p.Price * (decimal)p.Discount / 100m))
                    >= query.MinPrice.GetValueOrDefault())

            .WhereIf(query.MaxPrice.HasValue,
                p =>
                    (p.Price - (p.Price * (decimal)p.Discount / 100m))
                    <= query.MaxPrice.GetValueOrDefault())

            .WhereIf(query.CategoryId.HasValue,
                p => p.Categories.Any(c =>
                    c.Id == query.CategoryId &&
                    !c.IsDeleted &&
                    c.IsActive))

            .WhereIf(!string.IsNullOrWhiteSpace(query.Keyword),
                p =>
                    p.Name.Contains(query.Keyword!) ||
                    (p.Description ?? string.Empty).Contains(query.Keyword!) ||
                    p.Sku.Contains(query.Keyword!) ||
                    p.UrlSlug.Contains(query.Keyword!));

        return products;
    }

    public async Task<bool> DeleteProductAsync(
        Guid productId,
        CancellationToken cancellationToken = default)
    {
        return await _context.Set<Product>()
            .Where(p => p.Id == productId)
            .ExecuteDeleteAsync(cancellationToken) > 0;
    }

    public async Task<IList<Product>> GetMostSaledProductsAsync(
        int numberOfProducts,
        CancellationToken cancellationToken = default)
    {
        return await _context.Set<Product>()
            .AsNoTracking()
            .Include(p => p.Pictures)
            .Include(p => p.Categories)
            .Where(IsPublicVisible())
            .Where(p => p.Quantity > 0 && p.IsActive)
            .OrderByDescending(p => p.CountOrder)
            .Take(numberOfProducts)
            .ToListAsync(cancellationToken);
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

    #endregion

    #region Related Products

    public async Task<IList<Product>> GetRelatedProductsAsync(
        string slug,
        int num = 10,
        CancellationToken cancellationToken = default)
    {
        var product = await _context.Set<Product>()
            .Include(p => p.Categories)
            .FirstOrDefaultAsync(p => p.UrlSlug == slug, cancellationToken);

        if (product == null || product.Categories.Count == 0)
            return new List<Product>();

        var categoryIds = product.Categories.Select(c => c.Id).ToList();

        return await _context.Set<Product>()
            .AsNoTracking()
            .Include(p => p.Categories)
            .Include(p => p.Pictures)
            .Where(IsPublicVisible())
            .Where(p =>
                p.Id != product.Id &&
                p.IsActive &&
                !p.IsDeleted &&
                p.Categories.Any(c => categoryIds.Contains(c.Id)))
            .OrderByDescending(p => p.CountOrder)
            .Take(num)
            .ToListAsync(cancellationToken);
    }

    #endregion

    #region Toggle

    public async Task<bool> ToggleActiveProductAsync(
        Guid productId,
        CancellationToken cancellationToken = default)
    {
        return await _context.Set<Product>()
            .Where(p => p.Id == productId)
            .ExecuteUpdateAsync(p =>
                p.SetProperty(x => x.IsActive, x => !x.IsActive),
                cancellationToken) > 0;
    }

    public async Task<bool> ToggleDeleteProductAsync(
        Guid productId,
        Guid userId,
        string reason,
        CancellationToken cancellationToken = default)
    {
         var product = await _context.Set<Product>()
        .FirstOrDefaultAsync(p => p.Id == productId, cancellationToken);
    
    if (product == null)
        return false;

    var wasDeleted = product.IsDeleted;
    
    var updated = await _context.Set<Product>()
        .Where(p => p.Id == productId)
        .ExecuteUpdateAsync(p =>
            p.SetProperty(x => x.IsDeleted, x => !x.IsDeleted),
            cancellationToken) > 0;

    if (updated)
    {
        _context.Set<ProductHistory>().Add(new ProductHistory
        {
            ProductId = productId,
            UserId = userId,
            HistoryAction = wasDeleted 
                ? ProductHistoryAction.Restore 
                : ProductHistoryAction.Delete,
            EditReason = reason
        });
        
        await _context.SaveChangesAsync(cancellationToken);
    }

    return updated;
    }

    public async Task<bool> SetImageUrlAsync(Guid productId, string imageUrl, CancellationToken cancellationToken = default)
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
            Active = true
        });

        return await _context.SaveChangesAsync(cancellationToken) > 0;
    }

    public async Task<IList<Picture>> GetImageUrlsAsync(Guid productId, CancellationToken cancellationToken = default)
    {
        return await _context.Set<Picture>()
            .AsNoTracking()
            .Where(p => p.ProductId == productId && p.Active)
            .ToListAsync(cancellationToken);
    }

    public async Task<bool> DeleteImageUrlsAsync(Guid productId, CancellationToken cancellationToken = default)
    {
        var deletedCount = await _context.Set<Picture>()
        .Where(p => p.ProductId == productId)
        .ExecuteDeleteAsync(cancellationToken);

        return deletedCount > 0;
    }

    
    public async Task<bool> DeleteProductHistoriesAsync(IList<Guid> historyIds, CancellationToken cancellationToken = default)
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

    #endregion
}
