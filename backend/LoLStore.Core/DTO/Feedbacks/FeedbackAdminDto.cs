namespace LoLStore.Core.DTO.Feedbacks;

public class FeedbackAdminDto : FeedbackDto
{
    public bool IsHidden { get; set; }
    public int ReportCount { get; set; }
    public int PendingReportCount { get; set; }
}