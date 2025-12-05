using LoLStore.Core.Entities;
using LoLStore.Data.Mappings;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace LoLStore.Data.Contexts;

public class StoreDbContext : DbContext
{
    public DbSet<Product> Products { get; set; }
    public DbSet<Picture> Pictures { get; set; }
    public DbSet<ProductHistory> ProductHistories { get; set; }
    public DbSet<Feedback> Feedbacks { get; set; }
    public DbSet<Order> Orders { get; set; }
    public DbSet<OrderItem> OrderItems { get; set; }
    public DbSet<Discount> Discounts { get; set; }
    public DbSet<Category> Categories { get; set; }
    public DbSet<Supplier> Suppliers { get; set; }
    public DbSet<User> Users { get; set; }
    public DbSet<Role> Roles { get; set; }
    public DbSet<UserRefreshToken> UserRefreshTokens  { get; set; }

    public StoreDbContext(DbContextOptions<StoreDbContext> options) : base(options)
    {
    }

     public class StoreDbContextFactory : IDesignTimeDbContextFactory<StoreDbContext>
    {
        public StoreDbContext CreateDbContext(string[] args)
        {
            var optionsBuilder = new DbContextOptionsBuilder<StoreDbContext>();
            optionsBuilder.UseSqlServer("Server=(local);Database=LoLStore;Trusted_Connection=True;MultipleActiveResultSets=True;TrustServerCertificate=True");

            return new StoreDbContext(optionsBuilder.Options);
        }
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.ApplyConfigurationsFromAssembly(typeof(CategoryMap).Assembly);
    }
}