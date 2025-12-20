using LoLStore.Core.Contracts;

namespace LoLStore.Core.Entities;

public class Feedback
{
    public Guid Id { get; set; }
    public Guid ProductId { get; set; }
    
    // Required fields
    public string UserName { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public int Rating { get; set; }

    // Navigation properties
    public Product Product { get; set; } = null!;
    public IList<FeedbackPicture> Pictures { get; set; } = new List<FeedbackPicture>();
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