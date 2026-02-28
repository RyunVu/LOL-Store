using LoLStore.Core.Constants;

namespace LoLStore.Core.Queries;

public class ProductQuery
{
     public string? Keyword { get; set; }

    public Guid? CategoryId { get; set; }
    public string? CategorySlug { get; set; }
    public string? SubCategorySlug { get; set; }

    public bool? IsActive { get; set; }
    public bool? IsDeleted { get; set; }
    public bool? IsPublished { get; set; }

    public int? Year { get; set; }
    public int? Month { get; set; }
    public int? Day { get; set; }

    public decimal? MinPrice { get; set; }
    public decimal? MaxPrice { get; set; }

    public DateFilterType? DateFilter { get; set; }
    public SortOrder? SortOrder { get; set; }
}