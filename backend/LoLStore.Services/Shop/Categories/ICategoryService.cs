using LoLStore.Core.DTO.Categories;

namespace LoLStore.Services.Shop.Categories;

public interface ICategoryService
{
    Task<Guid> CreateAsync(CreateCategoryDto dto, CancellationToken cancellationToken = default);

    Task UpdateAsync(UpdateCategoryDto dto, CancellationToken cancellationToken = default);

    Task ToggleSoftDeleteAsync(Guid id, CancellationToken cancellationToken = default);

    Task ToggleActiveAsync(Guid id, CancellationToken cancellationToken = default);
    Task DeletePermanentlyAsync(Guid id, CancellationToken cancellationToken = default);
}
