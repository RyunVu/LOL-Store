using LoLStore.Core.Entities;
using LoLStore.Data.Contexts;
using LoLStore.Data.Seeders;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;


public class DataSeeder : IDataSeeder
{
    private readonly StoreDbContext _context;
    private readonly IPasswordHasher _hasher;
    private readonly IConfiguration _config;
    
    public DataSeeder(StoreDbContext context, IPasswordHasher hasher, IConfiguration config)
    {
        _context = context;
        _hasher = hasher;
        _config = config;
    }

    public async Task InitializeAsync()
    {
        try
        {
            await _context.Database.MigrateAsync();

            var roles = await _context.Roles.AnyAsync()
                ? await _context.Roles.ToListAsync()
                : await AddRolesAsync();

            if (!await _context.Users.AnyAsync())
                await AddUsersAsync(roles);

            if (!await _context.Categories.AnyAsync())
                await AddCategoriesAsync();

            if (!await _context.Discounts.AnyAsync())
                await AddDiscountAsync();

            if (!await _context.Suppliers.AnyAsync())
                await AddSuppliersAsync();

            if (!await _context.Products.AnyAsync())
            {
                await AddProductAsync(
                    await _context.Categories.ToListAsync(),
                    await _context.Suppliers.ToListAsync());
            }

            if (!await _context.Orders.AnyAsync())
            {
                var users = await _context.Users.ToListAsync();
                var products = await _context.Products.ToListAsync();
                var discounts = await _context.Discounts.ToListAsync();

                var orders = OrderSeeder.Generate(users, products, discounts);

                _context.Orders.AddRange(orders);
                await _context.SaveChangesAsync();
            }


        }
        catch (Exception ex)
        {
            Console.ForegroundColor = ConsoleColor.Red;
            Console.WriteLine("Database seeding failed");
            Console.WriteLine(ex);
            Console.ResetColor();
            throw;
        }
    }

    private async Task<IList<Role>> AddRolesAsync()
    {
        var roles = new List<Role>
        {
            new() { Name = "Admin" },
            new() { Name = "Manager" },
            new() { Name = "User" }
        };

        _context.Roles.AddRange(roles);
        await _context.SaveChangesAsync();
        return roles;
    }

    private async Task AddUsersAsync(IList<Role> roles)
    {
        var adminPassword = _config["INITIAL_ADMIN_PASSWORD"];

        if (string.IsNullOrWhiteSpace(adminPassword))
            throw new InvalidOperationException(
                "INITIAL_ADMIN_PASSWORD is required when seeding admin users.");


        var adminUser = new User
        {
            
            Name = "Admin",
            Email = "admin@lolstore.local",
            Address = "N/A",
            Phone = "N/A",
            UserName = "admin",
            Password = _hasher.HashPassword(adminPassword),
            CreatedDate = DateTime.UtcNow,
            Roles = roles.ToList()
        };

        _context.Users.Add(adminUser);
        await _context.SaveChangesAsync();
    }

    private async Task<IList<Category>> AddCategoriesAsync()
    {
        var categories = new List<Category>()
        {
            new() { Name = "Figurines", UrlSlug = "figures"},
            new() { Name = "Statues", UrlSlug = "statues"},
            new() { Name = "Acrylics", UrlSlug = "acrylics"},
        };

        _context.Categories.AddRange(categories);        
        await _context.SaveChangesAsync();

        return categories;
    }

    private async Task<IList<Discount>> AddDiscountAsync()
    {
        var discounts = new List<Discount>
    {
        new()
        {
            
            Code = "WELCOME10",
            DiscountValue = 10, // 10% off
            IsPercentage = true,
            MinimunOrderAmount = 0,
            MaxUses = 100,
            TimesUsed = 0,
            StartDate = DateTime.UtcNow,
            EndDate = DateTime.UtcNow.AddMonths(3),
            CreatedAt = DateTime.UtcNow,
            IsActive = true
        },
        new()
        {
            
            Code = "SAVE50",
            DiscountValue = 50, // $50 off
            IsPercentage = false,
            MinimunOrderAmount = 300, // only for big orders
            MaxUses = 50,
            TimesUsed = 0,
            StartDate = DateTime.UtcNow,
            EndDate = DateTime.UtcNow.AddMonths(2),
            CreatedAt = DateTime.UtcNow,
            IsActive = true
        },
        new()
        {
            
            Code = "WEEKEND5",
            DiscountValue = 5, // 5% off
            IsPercentage = true,
            MinimunOrderAmount = 100,
            MaxUses = null, // unlimited
            TimesUsed = 0,
            StartDate = DateTime.UtcNow.AddDays(-3), // started already
            EndDate = DateTime.UtcNow.AddDays(30),
            CreatedAt = DateTime.UtcNow.AddDays(-3),
            IsActive = true
        }
    };

        _context.Discounts.AddRange(discounts);
        await _context.SaveChangesAsync();

        return discounts;
    }

    private async Task<IList<Supplier>> AddSuppliersAsync()
    {
        var suppliers = new List<Supplier>
        {
            new()
            {
                
                Name = "Riot Merch Store",
                ContactEmail = "support@riotmerch.com",
                Phone = "+1-800-RIOT-LOL",
                ContactName = "Riot Distribution Team",
                Address = "123 Summoner’s Rift Blvd, Los Angeles, CA, USA",
                Email = "info@riotmerch.com",
                Description = "Official League of Legends merchandise supplier.",
                IsDeleted = false
            },
            new()
            {
                
                Name = "AnimeFigures Co.",
                ContactEmail = "sales@animefigures.co.jp",
                Phone = "+81-3-4567-8910",
                ContactName = "Yuki Nakamura",
                Address = "Tokyo, Japan",
                Email = "contact@animefigures.co.jp",
                Description = "High-quality anime and game figurine manufacturer.",
                IsDeleted = false
            },
            new()
            {
                
                Name = "LoL Collectibles Ltd.",
                ContactEmail = "info@lolcollectibles.com",
                Phone = "+44-20-1234-5678",
                ContactName = "Emma Watson",
                Address = "London, United Kingdom",
                Email = "sales@lolcollectibles.com",
                Description = "European supplier specializing in LoL-themed collectibles.",
                IsDeleted = false
            }
        };

        _context.Suppliers.AddRange(suppliers);
        await _context.SaveChangesAsync();

        return suppliers;
    }


    private async Task<IList<Product>> AddProductAsync(IList<Category> categories, IList<Supplier> suppliers)
    {
        var products = new List<Product>
        {
            new()
            {
                
                Sku = "LOL-FIG-001",
                UrlSlug = "ahri-figurine",
                Name = "Ahri The Nine-Tailed Fox Figurine",
                Description = "A detailed 1/7 scale Ahri figurine with magic orb accessory.",
                Price = 89.99m,
                Quantity = 50,
                Discount = 0,
                Note = "Limited edition, highly detailed collectible.",
                IsActive = true,
                IsDeleted = false,
                SupplierId = suppliers[0].Id, // Riot Merch Store
                CountOrder = 0,
                Categories = new List<Category> { categories[0] } // Figurines
            },
            new()
            {
                
                Sku = "LOL-STA-002",
                UrlSlug = "yasuo-statue",
                Name = "Yasuo The Unforgiven Statue",
                Description = "Premium resin statue of Yasuo in Wind Slash pose.",
                Price = 159.99m,
                Quantity = 30,
                Discount = 10, // maybe 10% off
                Note = "Includes certificate of authenticity.",
                IsActive = true,
                IsDeleted = false,
                SupplierId = suppliers[1].Id, // AnimeFigures Co.
                CountOrder = 0,
                Categories = new List<Category> { categories[1] } // Statues
            },
            new()
            {
                
                Sku = "LOL-ACR-003",
                UrlSlug = "jinx-acrylic-stand",
                Name = "Jinx Acrylic Stand",
                Description = "Colorful acrylic display stand featuring Jinx and Pow-Pow.",
                Price = 19.99m,
                Quantity = 200,
                Discount = 0,
                Note = "Perfect for your desk setup.",
                IsActive = true,
                IsDeleted = false,
                SupplierId = suppliers[2].Id, // LoL Collectibles Ltd.
                CountOrder = 0,
                Categories = new List<Category> { categories[2] } // Acrylics
            }
        };

        _context.Products.AddRange(products);
        await _context.SaveChangesAsync();

        return products;
    }

}