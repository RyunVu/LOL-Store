namespace LoLStore.API.Models.ProductModel;

public class ProductEditModel
{
    public string Name { get; set; } = string.Empty;
    public string Sku { get; set; } = string.Empty;
    public string Note { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;

    public string? UrlSlug { get; set; }

    public decimal Price { get; set; }

    public int Quantity { get; set; }

    public int MinQuantity { get; set; }

    public decimal Discount { get; set; }

    public Guid SupplierId { get; set; }

    public string? EditReason{ get; set; }
    
    public bool IsActive { get; set; }

    public IList<Guid> CategoryIds { get; set; } = new List<Guid>();

}

public class ProductEditReason
{
    public string EditReason { get; set; } = string.Empty;
}