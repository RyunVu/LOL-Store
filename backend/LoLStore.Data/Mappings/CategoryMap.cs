using Microsoft.EntityFrameworkCore.Metadata.Builders;
using LoLStore.Core.Entities;
using Microsoft.EntityFrameworkCore;

namespace LoLStore.Data.Mappings;

public class CategoryMap : IEntityTypeConfiguration<Category>
{
    public void Configure(EntityTypeBuilder<Category> builder)
    {
        builder.ToTable("Categories");

        builder.HasKey(c => c.Id);

        builder.Property(c => c.Name)
            .IsRequired()
            .HasMaxLength(128);

        builder.Property(c => c.Description)
            .HasMaxLength(512);

        builder.Property(p => p.UrlSlug)
			.HasMaxLength(256)
			.IsRequired();

		builder.Property(c => c.IsActive)
			.IsRequired()
			.HasDefaultValue(false);

        builder.Property(s => s.IsDeleted)
            .IsRequired()
            .HasDefaultValue(false);
    }
}