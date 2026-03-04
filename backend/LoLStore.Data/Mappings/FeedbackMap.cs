using Microsoft.EntityFrameworkCore.Metadata.Builders;
using LoLStore.Core.Entities;
using Microsoft.EntityFrameworkCore;

namespace LoLStore.Data.Mappings;
public class FeedbackMap : IEntityTypeConfiguration<Feedback>
{
    public void Configure(EntityTypeBuilder<Feedback> builder)
    {
        builder.ToTable("Feedbacks");

        builder.HasKey(f => f.Id);

        builder.Property(f => f.UserName)
            .IsRequired()
            .HasMaxLength(128);

        builder.Property(f => f.CreatedAt)
            .IsRequired()
            .HasColumnType("datetime");

        builder.Property(f => f.Content)
            .IsRequired()
            .HasMaxLength(2048);

        builder.Property(f => f.Rating)
            .IsRequired();
            
        builder.Property(f => f.IsHidden)
            .IsRequired()
            .HasDefaultValue(false);

        builder
            .HasOne(f => f.Product)
            .WithMany(p => p.Feedback)
            .HasForeignKey(f => f.ProductId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}