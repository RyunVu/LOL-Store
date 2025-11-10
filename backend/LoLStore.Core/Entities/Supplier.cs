using LoLStore.Core.Contracts;

namespace LoLStore.Core.Entities;

public class Supplier : IEntity
{
    public Guid Id { get; set; }
    public string Name { get; set; }
    public string ContactEmail { get; set; }
    public string Phone { get; set; }
    public string ContactName { get; set; }
    public string Address { get; set; }
    public string Email { get; set; }
    public bool IsDeleted { get; set; }
    public string Description { get; set; }

    // Navigation properties
    public IList<Product> Products { get; set; }
}