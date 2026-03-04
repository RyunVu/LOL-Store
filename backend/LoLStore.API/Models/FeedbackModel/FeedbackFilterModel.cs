namespace LoLStore.API.Models.FeedbackModel;

public class FeedbackFilterModel : PagingModel
{
    public Guid? ProductId { get; set; }
    public string? Keyword { get; set; }
    public int? MinRating { get; set; }
    public int? MaxRating { get; set; }
    public bool? IsHidden { get; set; }
    public bool HasReports { get; set; } = false;
}