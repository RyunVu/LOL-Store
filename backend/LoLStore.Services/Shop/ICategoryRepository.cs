using LoLStore.Core.DTO;
using LoLStore.Core.Entities;
using LoLStore.Core.Queries;

namespace LoLStore.Services.Shop;

public interface ICategoryRepository
{
    // Queries
    Task<IPagedList<Category>> SearchCategoriesAsync(string keyword, IPagingParams pagingParams, CancellationToken cancellationToken = default);
    Task<IPagedList<T>> GetPagedCategoriesAsync<T>(CategoryQuery query, IPagingParams pagingParams, Func<IQueryable<Category>, IQueryable<T>> mapper,CancellationToken cancellationToken = default);
    Task<IPagedList<T>> GetPagedCategoriesForUserAsync<T>(CategoryQuery query, IPagingParams pagingParams, Func<IQueryable<Category>, IQueryable<T>> mapper,CancellationToken cancellationToken = default);
    Task<IList<CategoryItem>> GetRelatedCategoriesBySlugAsync(CategoryQuery query, CancellationToken cancellationToken = default);
    Task<Category?> GetCategoryByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<Category?> GetCategoryBySlugAsync(string slug, bool isUser = false, CancellationToken cancellationToken = default);

    // Mutations
    Task<Category> AddOrUpdateCategoryAsync(Category category, CancellationToken cancellationToken = default);
    Task<bool> SoftDeleteToggleCategoryAsync(Guid id, CancellationToken cancellationToken = default);
    Task<bool> HardDeleteCategoryAsync(Guid id, CancellationToken cancellationToken = default);
    Task<bool> ToggleShowOnMenuAsync(Guid id, CancellationToken cancellationToken = default);

    // Validations
    Task<bool> IsCategoryNameExistedAsync(string name, Guid? excludeId, CancellationToken cancellationToken = default);
}