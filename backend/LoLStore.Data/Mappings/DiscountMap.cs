using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using LoLStore.Core.Entities;

namespace LoLStore.Data.Mappings;

public class DiscountMap : IEntityTypeConfiguration<Discount>
{
    public void Configure(EntityTypeBuilder<Discount> builder)
    {
        builder.ToTable("Discounts");

        builder.HasKey(d => d.Id);

        builder.Property(d => d.Code)
            .IsRequired()
            .HasMaxLength(128);

        builder.Property(d => d.DiscountValue)
            .IsRequired()
            .HasPrecision(18, 2);

        builder.Property(d => d.IsPercentage)
            .IsRequired()
            .HasDefaultValue(false);

        builder.Property(d => d.MinimunOrderAmount)
            .HasPrecision(18, 2);

        builder.Property(d => d.MaxUses)
            .HasDefaultValue(null);

        builder.Property(d => d.TimesUsed)
            .IsRequired()
            .HasDefaultValue(0);

        builder.Property(d => d.StartDate)
            .IsRequired()
            .HasColumnType("datetime2");

        builder.Property(d => d.EndDate)
            .IsRequired()
            .HasColumnType("datetime2");

        builder.Property(d => d.CreatedAt)
            .IsRequired()
            .HasColumnType("datetime2");

        builder.Property(d => d.IsActive)
            .IsRequired()
            .HasDefaultValue(true);

        builder.HasIndex(d => d.Code)
            .IsUnique();
    }
}
