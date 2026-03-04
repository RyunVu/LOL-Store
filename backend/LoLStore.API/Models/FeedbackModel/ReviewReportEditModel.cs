using LoLStore.Core.Entities;

namespace LoLStore.API.Models.FeedbackModel;

public class ReviewReportEditModel
{
    public FeedbackReportStatus Status { get; set; }
    public string? AdminNote { get; set; }
    public bool HideFeedback { get; set; } = false;
}