namespace LoLStore.API.Models.ProductModel;

public class ProductFilterModel : PagingModel
{
    public string? Keyword { get; set; }
    public string? CategorySlug { get; set; }
    public string? SubCategorySlug { get; set; }
    public string? ProductSlug { get; set; }
    public bool? Active { get; set; } = true;
    public bool? IsDeleted { get; set; } = false;
    public bool? IsPublished { get; set; } = true;
    public int? Year { get; set; }
    public int? Month { get; set; }
    public int? Day { get; set; }
    public decimal MinPrice { get; set; } = 0;
    public decimal MaxPrice { get; set; } = decimal.MaxValue;
}