using LoLStore.Core.Entities;
using LoLStore.Data.Contexts;
using Microsoft.EntityFrameworkCore;

public class DataSeeder : IDataSeeder
{
    private readonly StoreDbContext _context;
    private readonly IPasswordHasher _hasher;
    
    public DataSeeder(StoreDbContext context, IPasswordHasher hasher)
    {
        _context = context;
        _hasher = hasher;
    }

    public async Task InitializeAsync()
    {
        await _context.Database.EnsureCreatedAsync();

         IList<Role> roles;
        if (!await _context.Roles.AnyAsync())
        {
            roles = AddRoles();
        }
        else
        {
            roles = await _context.Roles.ToListAsync();
        }

        if (!await _context.Users.AnyAsync())
        {
            var users = AddUsers(roles);
        }

        if (!await _context.Categories.AnyAsync())
            AddCategories();

        if (!await _context.Discounts.AnyAsync())
            AddDiscount();

        if (!await _context.Suppliers.AnyAsync())
            AddSuppliers();

        if (!await _context.Products.AnyAsync())
            AddProduct(await _context.Categories.ToListAsync(),
                    await _context.Suppliers.ToListAsync());
    }

    private IList<Role> AddRoles()
    {
        var roles = new List<Role>()
        {
            new() {Id = Guid.NewGuid(), Name = "Admin"},
            new() {Id = Guid.NewGuid(), Name = "Manager"},
            new() {Id = Guid.NewGuid(), Name = "User"}
        };

        _context.Roles.AddRange(roles);
        _context.SaveChanges();
        return roles;
    }

    private IList<User> AddUsers(IList<Role> roles)
    {
        var users = new List<User>()
        {
            new()
            {
                Name = "Admin",
                Email = "Admin@gmail.com",
                Address = "Bruh",
                Phone = "0123456789",
                Username = "admin",
                Password = _hasher.HashPassword("admin123"),
                CreatedDate = DateTime.Now,
                Roles = new List<Role>()
                {
                    roles[0],
                    roles[1],
                    roles[2],
                }
            }
        };

        _context.Users.AddRange(users);
        _context.SaveChanges();

        return users;
    }

    private IList<Category> AddCategories()
    {
        var categories = new List<Category>()
        {
            new() {Id = Guid.NewGuid(), Name = "Figurines", UrlSlug = "figures"},
            new() {Id = Guid.NewGuid(), Name = "Statues", UrlSlug = "statues"},
            new() {Id = Guid.NewGuid(), Name = "Acrylics", UrlSlug = "acrylics"},
        };

        _context.Categories.AddRange(categories);
        _context.SaveChanges();

        return categories;
    }

    private IList<Discount> AddDiscount()
    {
        var discounts = new List<Discount>
    {
        new()
        {
            Id = Guid.NewGuid(),
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
            Id = Guid.NewGuid(),
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
            Id = Guid.NewGuid(),
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
        _context.SaveChanges();

        return discounts;
    }

    private IList<Supplier> AddSuppliers()
{
    var suppliers = new List<Supplier>
    {
        new()
        {
            Id = Guid.NewGuid(),
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
            Id = Guid.NewGuid(),
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
            Id = Guid.NewGuid(),
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
    _context.SaveChanges();

    return suppliers;
}


    private IList<Product> AddProduct(IList<Category> categories, IList<Supplier> suppliers)
{
    var products = new List<Product>
    {
        new()
        {
            Id = Guid.NewGuid(),
            Sku = "LOL-FIG-001",
            UrlSlug = "ahri-figurine",
            Name = "Ahri The Nine-Tailed Fox Figurine",
            Description = "A detailed 1/7 scale Ahri figurine with magic orb accessory.",
            CreateDate = DateTime.UtcNow,
            Price = 89.99,
            Quantity = 50,
            Discount = 0,
            Note = "Limited edition, highly detailed collectible.",
            Active = true,
            IsDeleted = false,
            SupplierId = suppliers[0].Id, // Riot Merch Store
            CountOrder = 0,
            Categories = new List<Category> { categories[0] } // Figurines
        },
        new()
        {
            Id = Guid.NewGuid(),
            Sku = "LOL-STA-002",
            UrlSlug = "yasuo-statue",
            Name = "Yasuo The Unforgiven Statue",
            Description = "Premium resin statue of Yasuo in Wind Slash pose.",
            CreateDate = DateTime.UtcNow,
            Price = 159.99,
            Quantity = 30,
            Discount = 10, // maybe 10% off
            Note = "Includes certificate of authenticity.",
            Active = true,
            IsDeleted = false,
            SupplierId = suppliers[1].Id, // AnimeFigures Co.
            CountOrder = 0,
            Categories = new List<Category> { categories[1] } // Statues
        },
        new()
        {
            Id = Guid.NewGuid(),
            Sku = "LOL-ACR-003",
            UrlSlug = "jinx-acrylic-stand",
            Name = "Jinx Acrylic Stand",
            Description = "Colorful acrylic display stand featuring Jinx and Pow-Pow.",
            CreateDate = DateTime.UtcNow,
            Price = 19.99,
            Quantity = 200,
            Discount = 0,
            Note = "Perfect for your desk setup.",
            Active = true,
            IsDeleted = false,
            SupplierId = suppliers[2].Id, // LoL Collectibles Ltd.
            CountOrder = 0,
            Categories = new List<Category> { categories[2] } // Acrylics
        }
    };

    _context.Products.AddRange(products);
    _context.SaveChanges();

    return products;
}

}