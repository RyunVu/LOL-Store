using Microsoft.EntityFrameworkCore.Metadata.Builders;
using LoLStore.Core.Entities;
using Microsoft.EntityFrameworkCore;

namespace LoLStore.Data.Mappings;

public class DiscountMap : IEntityTypeConfiguration<Discount>
{
    public void Configure(EntityTypeBuilder<Discount> builder)
    {
        builder.ToTable("Discounts");

        builder.HasKey(d => d.Id);

        builder.Property(d => d.Quantity)
			.IsRequired()
			.HasDefaultValue(0);

		builder.Property(d => d.MinPrice)
			.HasDefaultValue(0);

		builder.Property(d => d.CreateDate)
			.IsRequired()
			.HasColumnType("datetime");

		builder.Property(d => d.ExpiryDate)
			.IsRequired()
			.HasColumnType("datetime");

		builder.Property(d => d.Code)
			.IsRequired()
			.HasMaxLength(128);

		builder.Property(d => d.DiscountAmount)
			.IsRequired()
			.HasDefaultValue(0);

		builder.Property(d => d.Active)
			.IsRequired()
			.HasDefaultValue(false);

		builder.Property(d => d.IsDiscountPercentage)
			.IsRequired()
			.HasDefaultValue(false);
    }
}