using System.Linq.Expressions;
using LoLStore.Core.Entities;
using LoLStore.Core.Queries;

namespace LoLStore.Services.Shop;

public interface IProductRepository
{
    // Read operations
    Task<Product?> GetProductByIdAsync(
        Guid productId,
        bool getAll = false,
        CancellationToken cancellationToken = default);

    Task<Product?> GetProductBySlugAsync(
        string slug,
        CancellationToken cancellationToken = default);

    Task<IPagedList<Product>> GetPagedProductsAsync(
        ProductQuery query,
        IPagingParams pagingParams,
        CancellationToken cancellationToken = default);

    Task<IPagedList<T>> GetPagedProductsAsync<T>(
        ProductQuery query,
        IPagingParams pagingParams,
        Func<IQueryable<Product>, IQueryable<T>> mapper,
        CancellationToken cancellationToken = default);

    Task<IPagedList<T>> GetPagedProductsForUserAsync<T>(
        ProductQuery query,
        IPagingParams pagingParams,
        Func<IQueryable<Product>, IQueryable<T>> mapper,
        CancellationToken cancellationToken = default);

    Task<IList<Product>> GetMostSaledProductsAsync(
        int numberOfProducts,
        CancellationToken cancellationToken = default);

    Task<IList<Product>> GetRelatedProductsAsync(
        string slug,
        int num = 10,
        CancellationToken cancellationToken = default);

    // Write operations
    Task<Product> AddAsync(
        Product product,
        CancellationToken cancellationToken = default);

    Task<bool> UpdateAsync(
        Product product,
        CancellationToken cancellationToken = default);

    Task<bool> SaveChangesAsync(
        CancellationToken cancellationToken = default);

    Task<Product?> SetProductCategoriesAsync(
        Product product,
        IEnumerable<Guid> categoryIds,
        CancellationToken cancellationToken = default);

    Task<bool> DeleteProductAsync(
        Guid productId,
        CancellationToken cancellationToken = default);

    // Validation operations
    Task<bool> IsProductSlugExistedAsync(
        string slug,
        Guid? excludeProductId = null,
        CancellationToken cancellationToken = default);

    Task<bool> IsProductNameExistedAsync(
        string name,
        Guid? excludeProductId = null,
        CancellationToken cancellationToken = default);

    Task<bool> HasOrdersAsync(
        Guid productId,
        CancellationToken cancellationToken = default);

    // Toggle operations
    Task<bool> ToggleActiveProductAsync(
        Guid productId,
        CancellationToken cancellationToken = default);

    Task<bool> ToggleDeleteProductAsync(
        Guid productId,
        CancellationToken cancellationToken = default);

    // Picture operations
    Task<bool> SetImageUrlAsync(
        Guid productId,
        string imageUrl,
        CancellationToken cancellationToken = default);

    Task<IList<Picture>> GetImageUrlsAsync(
        Guid productId,
        CancellationToken cancellationToken = default);

    Task<bool> DeleteImageUrlsAsync(
        Guid productId,
        CancellationToken cancellationToken = default);

    // Product History operations
    Task<IPagedList<T>> GetPagedProductHistoriesAsync<T>(
        ProductHistoryQuery query,
        IPagingParams pagingParams,
        Func<IQueryable<ProductHistory>, IQueryable<T>> mapper,
        CancellationToken cancellationToken = default);

    Task<bool> DeleteProductHistoryAsync(
        Guid productHistoryId,
        CancellationToken cancellationToken = default);

    Task<bool> DeleteProductHistoriesAsync(
        IList<Guid> historyIds,
        CancellationToken cancellationToken = default);

    Task<bool> AddProductHistoryAsync(
        ProductHistory history,
        CancellationToken cancellationToken = default);
}