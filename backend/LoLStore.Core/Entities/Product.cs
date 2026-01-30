using LoLStore.Core.Contracts;

namespace LoLStore.Core.Entities;

public class Product : IEntity
{
    public Guid Id { get; set; }
    
    // Required fields
    public string Sku { get; set; } = string.Empty;
    public string UrlSlug { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    
    public DateTime CreateDate { get; set; } = DateTime.UtcNow;
    
    // Optional description
    public string Description { get; set; } = string.Empty;
    
    // Use decimal for money!
    public decimal Price { get; set; }
    public int Quantity { get; set; }
    public decimal Discount { get; set; }
    
    // Optional note
    public string Note { get; set; } = string.Empty;
    
    public bool IsActive { get; set; }
    public bool IsDeleted { get; set; }
    public Guid SupplierId { get; set; }
    public int CountOrder { get; set; }

    // Navigation properties
    public Supplier Supplier { get; set; } = null!;
    public IList<Category> Categories { get; set; } = new List<Category>();
    public IList<OrderDetail> OrderItems { get; set; } = new List<OrderDetail>();
    public IList<Feedback> Feedback { get; set; } = new List<Feedback>();
    public IList<Picture> Pictures { get; set; } = new List<Picture>(); 
    public IList<ProductHistory> ProductHistories { get; set; } = new List<ProductHistory>();
}