using LoLStore.Core.Entities;
using LoLStore.Core.Queries;
using LoLStore.Data.Contexts;
using LoLStore.Services.Extensions;
using Microsoft.EntityFrameworkCore;

namespace LoLStore.Services.Shop;

public class SupplierRepository : ISupplierRepository
{
    private readonly StoreDbContext _context;

    public SupplierRepository(StoreDbContext context)
    {
        _context = context;
    }

    public Task<IPagedList<T>> GetPagedSuppliersAsync<T>(SupplierQuery query, IPagingParams pagingParams, Func<IQueryable<Supplier>, IQueryable<T>> mapper, CancellationToken cancellationToken = default)
    {
        var suppliers = _context.Suppliers.AsQueryable();

        suppliers = suppliers
            .WhereIf(query.IsDeleted.HasValue, 
                s => s.IsDeleted == query.IsDeleted)
            .WhereIf(!string.IsNullOrWhiteSpace(query.Keyword), s =>
                s.Name.Contains(query.Keyword!) ||
                s.ContactName.Contains(query.Keyword!) ||
                s.Email.Contains(query.Keyword!) ||
                s.ContactEmail.Contains(query.Keyword!) ||
                s.Phone.Contains(query.Keyword!));

        var mappedSuppliers = mapper(suppliers);

        return mappedSuppliers.ToPagedListAsync(pagingParams, cancellationToken);
    }


    public async Task AddOrUpdateSupplierAsync(Supplier supplier, CancellationToken cancellationToken = default)
    {
        _context.Entry(supplier).State =
        supplier.Id == Guid.Empty
            ? EntityState.Added
            : EntityState.Modified;

        await _context.SaveChangesAsync(cancellationToken);
    }


    public async Task<Supplier?> GetSupplierByIdAsync(Guid supplierId, CancellationToken cancellationToken = default)
    {
        return await _context.Set<Supplier>()
            .FirstOrDefaultAsync(s => s.Id == supplierId, cancellationToken);
    }

    
    public async Task ToggleDeleteSupplierAsync(Guid supplierId, CancellationToken cancellationToken = default)
    {
        await _context.Set<Supplier>()
			.Where(s => s.Id == supplierId)
			.ExecuteUpdateAsync(s => s.SetProperty(d => d.IsDeleted, d => !d.IsDeleted), cancellationToken);
    }
}
