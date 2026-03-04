namespace LoLStore.Core.DTO.Feedbacks;

public class CreateFeedbackDto
{
    public Guid ProductId { get; set; }
    public string UserName { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public int Rating { get; set; }
    public IList<string> PictureUrls { get; set; } = new List<string>();
}