namespace LoLStore.API.Models.ProductModel;

public class ProductItem
{
    public Guid Id { get; set; }

    public string Name { get; set; } = string.Empty;

    public string Sku { get; set; } = string.Empty;

    public string Instruction { get; set; } = string.Empty;

    public DateTime CreateDate { get; set; }

    public string? Description { get; set; }

    public string UrlSlug { get; set; } = string.Empty;

    public decimal Price { get; set; }

    public int Quantity { get; set; }

    public decimal? Discount { get; set; }

    public bool Active { get; set; }

    public bool IsDeleted { get; set; }

    public int CountOrder { get; set; }

    // List Images later
}