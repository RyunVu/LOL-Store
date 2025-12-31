using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using LoLStore.Core.Entities;

namespace LoLStore.Data.Mappings;

public class OrderDetailMap : IEntityTypeConfiguration<OrderDetail>
{
    public void Configure(EntityTypeBuilder<OrderDetail> builder)
    {
        builder.ToTable("OrderDetails");

        builder.HasKey(od => new
        {
            od.OrderId,
            od.ProductId
        });

        builder.Property(od => od.Price)
            .IsRequired()
            .HasPrecision(18, 2)
            .HasDefaultValue(0);
    }
}
