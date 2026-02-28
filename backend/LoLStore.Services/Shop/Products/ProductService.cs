using LoLStore.Core.DTO.Products;
using LoLStore.Core.Entities;
using LoLStore.Services.Extensions;

namespace LoLStore.Services.Shop.Products;

public class ProductService : IProductService
{
    private readonly IProductRepository _repository;
    private readonly ISupplierRepository _supplierRepository;

    public ProductService(
        IProductRepository repository,
        ISupplierRepository supplierRepository)
    {
        _repository = repository;
        _supplierRepository = supplierRepository;
    }

    public async Task<Guid> CreateAsync(
        CreateProductDto dto,
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        // Generate slug from name
        var slug = dto.Name.GenerateSlug();

        // Validate slug uniqueness
        if (await _repository.IsProductSlugExistedAsync(slug, null, cancellationToken))
            throw new InvalidOperationException($"Product slug '{slug}' already exists.");

        // Validate supplier exists
        var supplier = await _supplierRepository.GetSupplierByIdAsync(dto.SupplierId, cancellationToken);
        if (supplier == null)
            throw new InvalidOperationException("Supplier not found.");

        // Create product entity
        var product = new Product
        {
            Name = dto.Name,
            UrlSlug = slug,
            Sku = dto.Sku,
            Description = dto.Description,
            Note = dto.Note,
            Price = dto.Price,
            Quantity = dto.Quantity,
            Discount = dto.Discount,
            IsActive = dto.IsActive,
            SupplierId = dto.SupplierId
        };

        // Save product
        await _repository.AddAsync(product, cancellationToken);

        // Set categories
        await _repository.SetProductCategoriesAsync(product, dto.CategoryIds, cancellationToken);

        // Log history
        await _repository.AddProductHistoryAsync(new ProductHistory
        {
            ProductId = product.Id,
            UserId = userId,
            HistoryAction = ProductHistoryAction.Create,
            EditReason = "Product created",
            ActionTime = DateTime.UtcNow
        }, cancellationToken);

        return product.Id;
    }

    public async Task<bool> UpdateAsync(
        UpdateProductDto dto,
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        // Fetch existing product
        var product = await _repository.GetProductByIdAsync(dto.Id, false, cancellationToken);
        if (product == null)
            return false;

        // Validate edit reason
        if (string.IsNullOrWhiteSpace(dto.EditReason))
            throw new InvalidOperationException("Edit reason is required.");

        // Generate new slug
        var slug = dto.Name.GenerateSlug();

        // Validate slug uniqueness (excluding current product)
        if (await _repository.IsProductSlugExistedAsync(slug, dto.Id, cancellationToken))
            throw new InvalidOperationException($"Product slug '{slug}' already exists.");

        // Validate supplier exists
        var supplier = await _supplierRepository.GetSupplierByIdAsync(dto.SupplierId, cancellationToken);
        if (supplier == null)
            throw new InvalidOperationException("Supplier not found.");

        // Update entity fields
        product.Name = dto.Name;
        product.UrlSlug = slug;
        product.Sku = dto.Sku;
        product.Description = dto.Description;
        product.Note = dto.Note;
        product.Price = dto.Price;
        product.Quantity = dto.Quantity;
        product.Discount = dto.Discount;
        product.IsActive = dto.IsActive;
        product.SupplierId = dto.SupplierId;
        product.UpdatedAt = DateTime.UtcNow;

        // Save changes
        await _repository.UpdateAsync(product, cancellationToken);

        // Update categories
        await _repository.SetProductCategoriesAsync(product, dto.CategoryIds, cancellationToken);

        // Log history
        await _repository.AddProductHistoryAsync(new ProductHistory
        {
            ProductId = product.Id,
            UserId = userId,
            HistoryAction = ProductHistoryAction.Update,
            EditReason = dto.EditReason,
            ActionTime = DateTime.UtcNow
        }, cancellationToken);

        return true;
    }

    public async Task<bool> ToggleActiveAsync(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        var product = await _repository.GetProductByIdAsync(id, false, cancellationToken);
        if (product == null)
            return false;

        product.UpdatedAt = DateTime.UtcNow;
        return await _repository.ToggleActiveProductAsync(id, cancellationToken);
    }

    public async Task<bool> ToggleSoftDeleteAsync(
        Guid id,
        Guid userId,
        string reason,
        CancellationToken cancellationToken = default)
    {
        var product = await _repository.GetProductByIdAsync(id, false, cancellationToken);
        if (product == null)
            return false;

        if (string.IsNullOrWhiteSpace(reason))
            throw new InvalidOperationException("Delete/restore reason is required.");

        var wasDeleted = product.IsDeleted;

        // Toggle soft delete
        var result = await _repository.ToggleDeleteProductAsync(id, cancellationToken);

        if (result)
        {
            // Log history
            await _repository.AddProductHistoryAsync(new ProductHistory
            {
                ProductId = id,
                UserId = userId,
                HistoryAction = wasDeleted
                    ? ProductHistoryAction.Restore
                    : ProductHistoryAction.Delete,
                EditReason = reason,
                ActionTime = DateTime.UtcNow
            }, cancellationToken);
        }

        return result;
    }

    public async Task<bool> DeletePermanentlyAsync(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        var product = await _repository.GetProductByIdAsync(id, false, cancellationToken);
        if (product == null)
            return false;

        // Must be soft-deleted first
        if (!product.IsDeleted)
            throw new InvalidOperationException("Product must be soft-deleted before permanent deletion.");

        // Validate no associated orders
        if (await _repository.HasOrdersAsync(id, cancellationToken))
            throw new InvalidOperationException("Cannot delete product with existing orders.");

        return await _repository.DeleteProductAsync(id, cancellationToken);
    }
}