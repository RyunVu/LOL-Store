using LoLStore.Core.Constants;
using LoLStore.Core.DTO.Categories;
using LoLStore.Core.Entities;
using LoLStore.Services.Extensions;

namespace LoLStore.Services.Shop.Categories;

public class CategoryService : ICategoryService
{
    private readonly ICategoryRepository _categoryRepository;

    public CategoryService(ICategoryRepository categoryRepository)
    {
        _categoryRepository = categoryRepository;
    }

    public async Task<Guid> CreateAsync(
        CreateCategoryDto dto,
        CancellationToken cancellationToken = default)
    {
        var slug = dto.Name.GenerateSlug();

        if (await _categoryRepository.ExistsBySlugAsync(slug, null, cancellationToken))
        {
            throw new InvalidOperationException("Category name already exists.");
        }

        var category = new Category
        {
            Name = dto.Name,
            Description = dto.Description,
            IsActive = dto.IsActive,
            UrlSlug = slug
        };

        await _categoryRepository.AddAsync(category, cancellationToken);

        return category.Id;
    }

    public async Task UpdateAsync(
        UpdateCategoryDto dto,
        CancellationToken cancellationToken = default)
    {
        var category = await _categoryRepository.GetByIdAsync(dto.Id, cancellationToken)
            ?? throw new KeyNotFoundException("Category not found.");

        var slug = dto.Name.GenerateSlug();

        if (await _categoryRepository.ExistsBySlugAsync(slug, dto.Id, cancellationToken))
        {
            throw new InvalidOperationException("Category name already exists.");
        }

        category.Name = dto.Name;
        category.Description = dto.Description;
        category.IsActive = dto.IsActive;
        category.UrlSlug = slug;
        category.UpdatedAt = DateTime.UtcNow;

        await _categoryRepository.SaveChangesAsync(cancellationToken);
    }

    public async Task ToggleSoftDeleteAsync(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        var category = await _categoryRepository.GetByIdAsync(id, cancellationToken)
            ?? throw new KeyNotFoundException("Category not found.");

        if (category.IsDeleted)
        {
            // Restore 
            category.IsDeleted = false;
            category.DeletedAt = null;
        }
        else
        {
            // Soft delete
            category.IsDeleted = true;
            category.IsActive = false;
            category.DeletedAt = DateTime.UtcNow;
        }

        category.UpdatedAt = DateTime.UtcNow;

        await _categoryRepository.SaveChangesAsync(cancellationToken);
    }

    public async Task DeletePermanentlyAsync(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        var category = await _categoryRepository.GetByIdAsync(id, cancellationToken)
            ?? throw new KeyNotFoundException("Category not found.");

        if (await _categoryRepository.HasProductsAsync(id, cancellationToken))
        {
            throw new InvalidOperationException(
                "Cannot delete category with associated products. " +
                "Please reassign or delete products first.");
        }

        var deleted = await _categoryRepository
            .DeletePermanentlyAsync(id, cancellationToken);

        if (!deleted)
        {
            throw new InvalidOperationException("Failed to delete category.");
        }
    }


    public async Task ToggleActiveAsync(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        var category = await _categoryRepository.GetByIdAsync(id, cancellationToken)
            ?? throw new KeyNotFoundException("Category not found.");

        // Business rule: cannot activate/deactivate a deleted category
        if (category.IsDeleted)
        {
            throw new InvalidOperationException(
                "Cannot change active state of a deleted category.");
        }

        category.IsActive = !category.IsActive;
        category.UpdatedAt = DateTime.UtcNow;

        await _categoryRepository.SaveChangesAsync(cancellationToken);
    }
}
