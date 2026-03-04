namespace LoLStore.Core.DTO.Feedbacks;

public class CreateFeedbackReportDto
{
    public Guid FeedbackId { get; set; }
    public string ReporterName { get; set; } = string.Empty;
    public string Reason { get; set; } = string.Empty;
}
