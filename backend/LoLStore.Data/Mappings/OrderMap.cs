using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using LoLStore.Core.Entities;

namespace LoLStore.Data.Mappings;

public class OrderMap : IEntityTypeConfiguration<Order>
{
    public void Configure(EntityTypeBuilder<Order> builder)
    {
        builder.ToTable("Orders");

        builder.HasKey(o => o.Id);

        builder.Property(o => o.Name)
            .IsRequired()
            .HasMaxLength(128);

        builder.Property(o => o.CodeOrder)
            .IsRequired()
            .HasMaxLength(128);

        builder.Property(o => o.Email)
            .IsRequired()
            .HasMaxLength(128);

        builder.Property(o => o.ShipAddress)
            .IsRequired()
            .HasMaxLength(512);

        builder.Property(o => o.Phone)
            .IsRequired()
            .HasMaxLength(12);

        builder.Property(o => o.Note)
            .HasMaxLength(1024);

        // 💰 Money fields
        builder.Property(o => o.DiscountAmount)
            .HasPrecision(18, 2)
            .HasDefaultValue(0);

        builder.Property(o => o.TotalAmount)
            .HasPrecision(18, 2)
            .HasDefaultValue(0);

        builder.Property(o => o.IsDiscountApplied)
            .IsRequired()
            .HasDefaultValue(false);

        // Order details
        builder.HasMany(o => o.OrderItems)
            .WithOne(d => d.Order)
            .HasForeignKey(d => d.OrderId)
            .HasConstraintName("FK_Orders_Details")
            .OnDelete(DeleteBehavior.Cascade);

        // Dates
        builder.Property(o => o.OrderDate)
            .IsRequired()
            .HasColumnType("datetime2");
    }
}
