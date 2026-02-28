using LoLStore.Core.Constants;

namespace LoLStore.API.Models.ProductModel;

public class ProductFilterModel : PagingModel
{
    public string? Keyword { get; set; }
    public Guid? CategoryId { get; set; }
    public bool? IsActive { get; set; } = true;
    public bool? IsPublished { get; set; } = true;    
    public int? Year { get; set; }
    public int? Month { get; set; }
    public int? Day { get; set; }
    public decimal? MinPrice { get; set; }
    public decimal? MaxPrice { get; set; } 
}

public class ProductManagerFilterModel : ProductFilterModel
{
    public bool? IsDeleted { get; set; }
    public DateFilterType? DateFilter { get; set; } 
}