using LoLStore.Core.Contracts;

namespace LoLStore.Core.Entities;

public class Supplier : IEntity
{
    public Guid Id { get; set; }
    
    // Required fields
    public string Name { get; set; } = string.Empty;
    public string ContactEmail { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string ContactName { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    
    public bool IsDeleted { get; set; }
    
    // Optional field
    public string? Description { get; set; }

    // Navigation property
    public IList<Product> Products { get; set; } = new List<Product>();
}