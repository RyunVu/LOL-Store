using LoLStore.Core.Contracts;

namespace LoLStore.Core.Entities;

public enum FeedbackReportStatus
{
    Pending,
    Reviewed,
    Actioned 
}

public class FeedbackReport : BaseEntity
{
    public Guid FeedbackId { get; set; }
    
    // Required fields
    public string ReporterName { get; set; } = string.Empty;
    public string Reason { get; set; } = string.Empty;
    public FeedbackReportStatus Status { get; set; } = FeedbackReportStatus.Pending;
    public string? AdminNote { get; set; }
    public DateTime? ReviewedAt { get; set; }

    // Navigation 
    public Feedback Feedback { get; set; } = null!;
}

