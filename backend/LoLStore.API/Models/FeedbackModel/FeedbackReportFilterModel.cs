// FeedbackReportFilterModel.cs
using LoLStore.Core.Entities;

namespace LoLStore.API.Models.FeedbackModel;

public class FeedbackReportFilterModel : PagingModel
{
    public Guid? FeedbackId { get; set; }
    public string? Keyword { get; set; }
    public FeedbackReportStatus? Status { get; set; }
}