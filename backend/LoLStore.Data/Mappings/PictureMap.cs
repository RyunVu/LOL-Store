using Microsoft.EntityFrameworkCore.Metadata.Builders;
using LoLStore.Core.Entities;
using Microsoft.EntityFrameworkCore;

namespace LoLStore.Data.Mappings;
public class PictureMap : IEntityTypeConfiguration<Picture>
{
    public void Configure(EntityTypeBuilder<Picture> builder)
    {
        builder.ToTable("Pictures");

        builder.HasKey(p => p.Id);

        builder.Property(p => p.Path)
            .IsRequired()
            .HasMaxLength(512);

        builder.Property(p => p.Active)
            .IsRequired()
            .HasDefaultValue(false);
    }
}