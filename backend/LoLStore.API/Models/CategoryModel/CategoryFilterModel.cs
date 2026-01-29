using LoLStore.Core.Constants;

namespace LoLStore.API.Models.CategoryModel;

public class CategoryFilterModel : PagingModel
{
    public string? Keyword { get; set; }
    public bool? IsActive { get; set; }
}

public class CategoryManagerFilterModel : CategoryFilterModel
{
    public bool? IsDeleted { get; set; }
    public DateFilterType? DateFilter { get; set; } 
}

public class CategoryRelateModel
{
    public string? Keyword { get; set; }
    public string UrlSlug { get; set; } = string.Empty;
}