using LoLStore.Core.Entities;

namespace LoLStore.Core.Queries;

public class FeedbackQuery
{
    public Guid? ProductId { get; set; }
    public string? Keyword { get; set; }
    public int? MinRating { get; set; }
    public int? MaxRating { get; set; }
    public bool? IsHidden { get; set; }
    public bool? HasReports { get; set; }
}

public class FeedbackReportQuery
{
    public Guid? FeedbackId { get; set; }
    public string? Keyword { get; set; }
    public FeedbackReportStatus? Status { get; set; }
}