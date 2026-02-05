using LoLStore.Core.Contracts;

namespace LoLStore.Core.Entities;

public class Category : BaseEntity
{
    
    // Required fields
    public string Name { get; set; } = string.Empty;
    public string UrlSlug { get; set; } = string.Empty;
    
    // Optional fields
    public string? Description { get; set; }
    
    // Flags
    public bool IsActive { get; set; }
    
    // Navigation properties
    public ICollection<Product> Products { get; set; } = new List<Product>();
}