using LoLStore.Core.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace LoLStore.Data.Mappings;

public class DiscountMap : IEntityTypeConfiguration<Discount>
{
    public void Configure(EntityTypeBuilder<Discount> builder)
    {
        builder.ToTable("Discounts");

        // Primary key
        builder.HasKey(d => d.Id);

        // Code
        builder.Property(d => d.Code)
            .IsRequired()
            .HasMaxLength(128);

		// DiscountValue (amount or percentage)
		builder.Property(d => d.DiscountValue)
			.IsRequired();

        // IsPercentage
        builder.Property(d => d.IsPercentage)
            .IsRequired()
            .HasDefaultValue(false);

        // MinimumOrderAmount (nullable)
        builder.Property(d => d.MinimunOrderAmount)
            .HasPrecision(18, 2);

        // MaxUses (nullable)
        builder.Property(d => d.MaxUses)
            .HasDefaultValue(null);

        // TimesUsed
        builder.Property(d => d.TimesUsed)
            .IsRequired()
            .HasDefaultValue(0);

        // Dates
        builder.Property(d => d.StartDate)
            .IsRequired()
            .HasColumnType("datetime2");

        builder.Property(d => d.EndDate)
            .IsRequired()
            .HasColumnType("datetime2");

        builder.Property(d => d.CreatedAt)
            .IsRequired()
            .HasColumnType("datetime2");

        // IsActive
        builder.Property(d => d.IsActive)
            .IsRequired()
            .HasDefaultValue(true);

        // Optional: add index for faster lookup by Code
        builder.HasIndex(d => d.Code)
            .IsUnique();
    }
}
