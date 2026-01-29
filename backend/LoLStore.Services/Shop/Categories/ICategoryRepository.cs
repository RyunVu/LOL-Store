using LoLStore.Core.DTO.Categories;
using LoLStore.Core.Entities;
using LoLStore.Core.Queries;

namespace LoLStore.Services.Shop.Categories;

public interface ICategoryRepository
{
    // ===== Queries =====

    Task<IPagedList<T>> GetPagedCategoriesAsync<T>(
        CategoryQuery query,
        IPagingParams pagingParams,
        Func<IQueryable<Category>, IQueryable<T>> mapper,
        CancellationToken ct = default);

    Task<IPagedList<T>> GetPagedCategoriesForUserAsync<T>(
        CategoryQuery query,
        IPagingParams pagingParams,
        Func<IQueryable<Category>, IQueryable<T>> mapper,
        CancellationToken ct = default);

    Task<IList<RelatedCategoryDto>> GetRelatedCategoriesBySlugAsync(
        CategoryQuery query,
        CancellationToken ct = default);

    Task<Category?> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<Category?> GetBySlugAsync(string slug, CancellationToken ct = default);
    Task<Category?> GetActiveBySlugAsync(string slug, CancellationToken ct = default);
    Task<bool> HasProductsAsync(Guid categoryId,CancellationToken cancellationToken = default);
    
    // ===== Write =====
    Task AddAsync(Category category, CancellationToken ct = default);
    Task SaveChangesAsync(CancellationToken cancellationToken = default);
    Task<bool> DeletePermanentlyAsync(Guid id, CancellationToken ct = default);

    // ===== Validation =====
    Task<bool> ExistsBySlugAsync(string slug, Guid? excludeId, CancellationToken ct = default);
}