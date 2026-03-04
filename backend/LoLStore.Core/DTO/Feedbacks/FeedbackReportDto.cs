using LoLStore.Core.Entities;

namespace LoLStore.Core.DTO.Feedbacks;

public class FeedbackReportDto
{
    public Guid Id { get; set; }
    public Guid FeedbackId { get; set; }
    public string ReporterName { get; set; } = string.Empty;
    public string Reason { get; set; } = string.Empty;
    public FeedbackReportStatus Status { get; set; }
    public string? AdminNote { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? ReviewedAt { get; set; }

    // So admin can see the feedback content without extra call
    public string FeedbackContent { get; set; } = string.Empty;
    public string FeedbackUserName { get; set; } = string.Empty;
    // FeedbackReportDto.cs
    public IList<string> FeedbackPictureUrls { get; set; } = new List<string>();
}