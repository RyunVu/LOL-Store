using LoLStore.Core.Entities;

namespace LoLStore.Core.DTO.Feedbacks;

public class ReviewFeedbackReportDto
{
    public Guid ReportId { get; set; }
    public FeedbackReportStatus Status { get; set; }
    public string? AdminNote { get; set; }
    public bool HideFeedback { get; set; } = false; // true = also hide the feedback
}