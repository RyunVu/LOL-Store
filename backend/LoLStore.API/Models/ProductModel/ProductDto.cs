using LoLStore.API.Models.CategoryModel;
using LoLStore.API.Models.PictureModel;

namespace LoLStore.API.Models.ProductModel;

public class ProductDto
{
	public Guid Id { get; set; }

	public string Name { get; set; } = string.Empty;

	public string Sku { get; set; } = string.Empty;

	public string Note { get; set; } = string.Empty;

	public DateTime CreateDate { get; set; }

	public string? Description { get; set; }
	public string UrlSlug { get; set; } = string.Empty;

	public decimal Price { get; set; }

	public decimal FinalPrice { get; set; }

	public int Quantity { get; set; }

	public decimal? Discount { get; set; }

	public bool Active { get; set; }

	public bool IsDeleted { get; set; }

	public int CountOrder { get; set; }

	public Guid SupplierId { get; set; }

	public IList<CategoryDto> Categories { get; set; } = new List<CategoryDto>();
    public IList<PictureDto> Pictures { get; set; } = new List<PictureDto>();
}