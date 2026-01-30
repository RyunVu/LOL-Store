using LoLStore.Core.Entities;
using LoLStore.Data.Contexts;
using Microsoft.EntityFrameworkCore;

namespace LoLStore.Data.Seeders;
public class ExtraProduct
{
    private readonly StoreDbContext _context;

    public ExtraProduct(StoreDbContext context)
    {
        _context = context;
    }

    public async Task SeedExtraProductsAsync()
    {
        if (await _context.Products.CountAsync() > 20)
            return; // prevent duplicate spam

        var categories = await _context.Categories.ToListAsync();
        var suppliers = await _context.Suppliers.ToListAsync();

        var products = new List<Product>();

        for (int i = 1; i <= 50; i++)
        {
            products.Add(new Product
            {
                Id = Guid.NewGuid(),
                Sku = $"DEV-PROD-{i:000}",
                Name = $"Test Product {i}",
                UrlSlug = $"test-product-{i}",
                Description = $"This is dev product number {i}",
                Price = Random.Shared.Next(10, 300),
                Quantity = Random.Shared.Next(1, 200),
                Discount = Random.Shared.Next(0, 20),
                IsActive = true,
                IsDeleted = false,
                CreateDate = DateTime.UtcNow,
                SupplierId = suppliers[i % suppliers.Count].Id,
                Categories = new List<Category>
                {
                    categories[i % categories.Count]
                }
            });
        }

        _context.Products.AddRange(products);
        await _context.SaveChangesAsync();
    }
}
