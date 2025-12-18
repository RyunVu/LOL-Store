using LoLStore.Core.Entities;
using LoLStore.Core.Queries;

namespace LoLStore.Services.Shop;

public interface ISupplierRepository
{
    Task<IPagedList<T>> GetPagedSuppliersAsync<T>(
        ISupplierQuery query,
        IPagingParams pagingParams,
        Func<IQueryable<Supplier>, IQueryable<T>> mapper,
        CancellationToken cancellationToken = default);

    Task<Supplier> GetSupplierByIdAsync(
        Guid supplierId,
        CancellationToken cancellationToken = default);

    Task AddOrUpdateSupplierAsync(
        Supplier supplier,
        CancellationToken cancellationToken = default);

    Task ToggleDeleteSupplierAsync(
        Guid supplierId,
        CancellationToken cancellationToken = default);

}