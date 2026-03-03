using Microsoft.EntityFrameworkCore.Metadata.Builders;
using LoLStore.Core.Entities;
using Microsoft.EntityFrameworkCore;

namespace LoLStore.Data.Mappings;
public class ProductMap : IEntityTypeConfiguration<Product>
{
    public void Configure(EntityTypeBuilder<Product> builder)
    {
        builder.ToTable("Products");

        builder.HasKey(s => s.Id);

		builder.Property(s => s.Name)
			.IsRequired()
			.HasMaxLength(128);

		builder.Property(s => s.UrlSlug)
			.IsRequired()
			.HasMaxLength(256);

        builder.Property(s => s.Sku)
            .IsRequired()
            .HasMaxLength(256)
            .HasDefaultValue("");

		builder.Property(s => s.Description)
			.HasMaxLength(2048)
			.HasDefaultValue("");

		builder.Property(s => s.Price)
			.IsRequired()
			.HasColumnType("decimal(18,2)")
			.HasDefaultValue(0m);

		builder.Property(s => s.Discount)
			.HasColumnType("decimal(5,2)")
			.HasDefaultValue(0m);

		builder.Property(s => s.Quantity)
			.IsRequired()
			.HasDefaultValue(0);


		builder.Property(p => p.IsActive)
			.IsRequired()
			.HasDefaultValue(false);
		
		builder.Property(p => p.WasActiveBeforeCategoryDeactivation)
			.IsRequired()
		    .HasDefaultValue(false);
		
		builder.Property(s => s.Note)
			.HasMaxLength(2048)
			.HasDefaultValue("");

		builder.Property(p => p.IsDeleted)
			.IsRequired()
			.HasDefaultValue(false);

		builder.Property(s => s.CountOrder)
			.IsRequired()
			.HasDefaultValue(0);

		// Unique SKU
		builder.HasIndex(p => p.Sku)
			.IsUnique();

		// Unique URL slug
		builder.HasIndex(p => p.UrlSlug)
			.IsUnique();

		// Common filters
		builder.HasIndex(p => new { p.IsActive, p.IsDeleted });

		// Sorting / top sales
		builder.HasIndex(p => p.CountOrder);

		// Date filters
		builder.HasIndex(p => p.CreatedAt);
		builder.HasIndex(p => p.UpdatedAt);

		// Optional: keyword search helpers
		builder.HasIndex(p => p.Name);

		builder.Property<decimal>("DiscountedPrice")
			.HasColumnType("decimal(18,2)")
			.HasComputedColumnSql(
				"[Price] - ([Price] * [Discount] / 100.0)",
				stored: true);

		builder.HasIndex("DiscountedPrice");

		builder.HasMany(p => p.Categories)
			.WithMany(c => c.Products)
			.UsingEntity<Dictionary<string, object>>(
				"ProductCategories",
				j => j
					.HasOne<Category>()
					.WithMany()
					.HasForeignKey("CategoriesId"),
				j => j
					.HasOne<Product>()
					.WithMany()
					.HasForeignKey("ProductsId"),
				j =>
				{
					j.HasKey("ProductsId", "CategoriesId");
					j.ToTable("ProductCategories");

					j.HasIndex("ProductsId");
					j.HasIndex("CategoriesId");
				});


		builder.HasMany(s => s.Pictures)
			.WithOne(s => s.Product)
			.HasForeignKey(s => s.ProductId)
			.HasConstraintName("FK_Products_Pictures")
			.OnDelete(DeleteBehavior.Cascade);

		builder.HasMany(o => o.OrderItems)
			.WithOne(d => d.Product)
			.HasForeignKey(d => d.ProductId)
			.HasConstraintName("FK_Products_Details")
			.OnDelete(DeleteBehavior.Restrict);

		builder.HasOne(p => p.Supplier)
			.WithMany(s => s.Products)
			.HasForeignKey(s => s.SupplierId)
			.HasConstraintName("FK_Products_Suppliers")
			.OnDelete(DeleteBehavior.Cascade);
    }
}