using LoLStore.Core.Contracts;

namespace LoLStore.Core.Entities;

public class Role : IEntity
{
    public Guid Id { get; set; }
    
    // Required field
    public string Name { get; set; } = string.Empty;
    
    // Navigation property
    public IList<User> Users { get; set; } = new List<User>();
}