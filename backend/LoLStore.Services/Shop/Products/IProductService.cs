using LoLStore.Core.DTO.Products;

namespace LoLStore.Services.Shop.Products;

public interface IProductService
{
    Task<Guid> CreateAsync(
        CreateProductDto dto,
        Guid userId,
        CancellationToken cancellationToken = default);

    Task<bool> UpdateAsync(
        UpdateProductDto dto,
        Guid userId,
        CancellationToken cancellationToken = default);

    Task<bool> ToggleActiveAsync(
        Guid id,
        CancellationToken cancellationToken = default);

    Task<bool> ToggleSoftDeleteAsync(
        Guid id,
        Guid userId,
        string reason,
        CancellationToken cancellationToken = default);

    Task<bool> DeletePermanentlyAsync(
        Guid id,
        CancellationToken cancellationToken = default);
}