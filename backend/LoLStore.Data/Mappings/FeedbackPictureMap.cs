using Microsoft.EntityFrameworkCore.Metadata.Builders;
using LoLStore.Core.Entities;
using Microsoft.EntityFrameworkCore;

namespace LoLStore.Data.Mappings;
public class FeedbackPictureMap : IEntityTypeConfiguration<FeedbackPicture>
{
    public void Configure(EntityTypeBuilder<FeedbackPicture> builder)
    {
        builder.ToTable("FeedbackPictures");

        builder.HasKey(fp => fp.Id);

        builder.Property(fp => fp.Path)
            .IsRequired()
            .HasMaxLength(512)
            .HasDefaultValue("");

        builder.HasOne(fp => fp.Feedback)
            .WithMany(f => f.Pictures)
            .HasForeignKey(fp => fp.FeedbackId)
            .HasConstraintName("FK_Feedback_Pictures")
            .OnDelete(DeleteBehavior.Cascade);
    }
}