using LoLStore.Core.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace LoLStore.Data.Mappings;

public class FeedbackReportMap : IEntityTypeConfiguration<FeedbackReport>
{
    public void Configure(EntityTypeBuilder<FeedbackReport> builder)
    {
        builder.ToTable("FeedbackReports");

        builder.HasKey(fr => fr.Id);

        builder.Property(fr => fr.ReporterName)
            .IsRequired()
            .HasMaxLength(128);

        builder.Property(fr => fr.Reason)
            .IsRequired()
            .HasMaxLength(2048);

        builder.Property(fr => fr.Status)
            .IsRequired()
            .HasDefaultValue(FeedbackReportStatus.Pending);

        builder.Property(fr => fr.AdminNote)
            .HasMaxLength(2048);

        builder.HasIndex(r => r.Status);

        builder.Property(fr => fr.ReviewedAt)
            .HasColumnType("datetime");
            
        builder.HasOne(r => r.Feedback)
            .WithMany(f => f.Reports)
            .HasForeignKey(r => r.FeedbackId)
            .HasConstraintName("FK_FeedbackReports_Feedback")
            .OnDelete(DeleteBehavior.Cascade);
    }
}