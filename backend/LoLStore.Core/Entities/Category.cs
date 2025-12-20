namespace LoLStore.Core.Entities;

public class Category 
{
    public Guid Id { get; set; }
    
    // Required fields
    public string Name { get; set; } = string.Empty;
    public string UrlSlug { get; set; } = string.Empty;
    
    // Optional fields
    public string? Description { get; set; }
    public string? ImageUrl { get; set; }
    public string? MetaDescription { get; set; }
    
    // Flags
    public bool ShowOnMenu { get; set; }
    public bool IsDeleted { get; set; }
    
    // Timestamps
    public DateTime CreatedDate { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedDate { get; set; }
    
    // Navigation properties
    public IList<Product> Products { get; set; } = new List<Product>();
}