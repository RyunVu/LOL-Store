using LoLStore.Core.Contracts;

namespace LoLStore.Core.Entities;

public class Picture : IEntity
{
    public Guid Id { get; set; }
    public Guid ProductId { get; set; }
    
    // Required field
    public string Path { get; set; } = string.Empty;
    public bool IsActive { get; set; }

    // Navigation property
    public Product Product { get; set; } = null!;
}