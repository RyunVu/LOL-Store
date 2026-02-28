using LoLStore.API.Models.PictureModel;

namespace LoLStore.API.Models.ProductModel;

public class ProductEditModel
{
    public string Name { get; set; } = string.Empty;
    public string Sku { get; set; } = string.Empty;
    public string Note { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;

    public decimal Price { get; set; }

    public int Quantity { get; set; }

    public decimal Discount { get; set; }

    public Guid SupplierId { get; set; }

    public string? EditReason { get; set; }
    
    public bool IsActive { get; set; }

    public IList<Guid> CategoryIds { get; set; } = new List<Guid>();
    public IList<PictureInputModel> Pictures { get; set; } = new List<PictureInputModel>();

}