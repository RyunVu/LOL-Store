using LoLStore.Core.Entities;

namespace LoLStore.Core.DTO.Products;

public class UpdateProductDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Sku { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Note { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public int Quantity { get; set; }
    public decimal Discount { get; set; }
    public bool IsActive { get; set; }
    public Guid SupplierId { get; set; }
    public IList<Guid> CategoryIds { get; set; } = new List<Guid>();    
    public IList<PictureInputDto> Pictures { get; set; } = new List<PictureInputDto>(); 
    public string EditReason { get; set; } = string.Empty;
}