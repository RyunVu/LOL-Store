using System.Globalization;
using LoLStore.Core.Entities;
using LoLStore.Core.Queries;

namespace LoLStore.Services.Shop;

public interface IProductRepository
{
    Task<Product> GetProductByIdAsync(Guid productId, CancellationToken cancellationToken = default);
    Task<Product> GetProductBySlugAsync(string slug, CancellationToken cancellationToken = default);
    Task<bool> IsProductSlugExistedAsync(string slug, Guid? excludeProductId = null, CancellationToken cancellationToken = default);
    Task<bool> IsProductExistedAsync(string name, Guid? excludeProductId = null, CancellationToken cancellationToken = default);
    Task<Product> AddOrUpdateProductAsync(Product product,Guid userId ,string EditReason = "", CancellationToken cancellationToken = default);
    Task<IPagedList<Product>> GetPagedProductsAsync(ProductQuery query, IPagingParams pagingParams, CancellationToken cancellationToken = default);
    Task<Product> SetProductCategoriesAsync(Guid productId, IEnumerable<Guid> categoryIds, CancellationToken cancellationToken = default);
    Task<IList<Product>> GetMostSaledProductsAsync(int numberOfProducts, CancellationToken cancellationToken = default);
    Task<IPagedList<Product>> GetRelatedProductsAsync(string slug, int num = 10, CancellationToken cancellationToken = default);
    Task<IPagedList<T>> GetPagedProductsAsync<T>(ProductQuery query, IPagingParams pagingParams, CancellationToken cancellationToken = default) where T : Product;
    Task<IPagedList<T>> GetPagedProductHistoriesAsync<T>(Guid productId, IPagingParams pagingParams, CancellationToken cancellationToken = default) where T : Product;
    Task<bool> DeleteProductAsync(Guid productId, CancellationToken cancellationToken = default);
    Task<bool> ToggleDeleteProductAsync(Guid productId, Guid userId, string reason, CancellationToken cancellationToken = default);
    Task<bool> ToggleActiveProductAsync(Guid productId, CancellationToken cancellationToken = default);
    Task<bool> ToggleProductHistoryAsync(Guid productHistoryId, CancellationToken cancellationToken = default);

    // Set image - do later 
}
