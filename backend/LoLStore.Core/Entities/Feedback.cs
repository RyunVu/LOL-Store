using LoLStore.Core.Contracts;

namespace LoLStore.Core.Entities;

public class Feedback : BaseEntity
{
    public Guid ProductId { get; set; }
    
    // Required fields
    public string UserName { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public int Rating { get; set; }
    public bool IsHidden { get; set; } = false;
    // Navigation properties
    public Product Product { get; set; } = null!;
    public ICollection<FeedbackPicture> Pictures { get; set; } = new List<FeedbackPicture>();
    public ICollection<FeedbackReport> Reports { get; set; } = new List<FeedbackReport>();
}

public class FeedbackPicture
{
    public Guid Id { get; set; }
    public Guid FeedbackId { get; set; }
    
    // Required field
    public string Path { get; set; } = string.Empty;

    // Navigation property
    public Feedback Feedback { get; set; } = null!;
}