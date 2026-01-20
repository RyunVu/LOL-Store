namespace LoLStore.Core.Queries;

public class ProductQuery
{
     public string? Keyword { get; set; }

    public Guid? CategoryId { get; set; }
    public string? CategorySlug { get; set; }
    public string? SubCategorySlug { get; set; }

    public bool? Active { get; set; }
    public bool? IsDeleted { get; set; }
    public bool? IsPublished { get; set; }

    public int? Year { get; set; }
    public int? Month { get; set; }
    public int? Day { get; set; }

    public decimal? MinPrice { get; set; }
    public decimal? MaxPrice { get; set; }
}