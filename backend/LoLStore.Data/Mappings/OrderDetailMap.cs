using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Microsoft.EntityFrameworkCore;
using LoLStore.Core.Entities;

namespace LoLStore.Data.Mappings;
public class OrderDetailMap : IEntityTypeConfiguration<OrderItem>
{
    public void Configure(EntityTypeBuilder<OrderItem> builder)
    {
        builder.HasKey(od => new
        {
            od.OrderId,
            od.ProductId
        });

        builder.ToTable("OrderDetails");

        builder.Property(od => od.Price)
            .IsRequired()
            .HasDefaultValue(0);
    }
}