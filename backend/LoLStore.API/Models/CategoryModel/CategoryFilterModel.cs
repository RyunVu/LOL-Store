namespace LoLStore.API.Models.CategoryModel;

public class CategoryFilterModel : PagingModel
{
    public string? Keyword { get; set; }
    public bool? ShowOnMenu { get; set; }
}

public class CategoryManagerFilter : CategoryFilterModel
{
    public bool? IsDeleted { get; set; }
}

public class CategoryRelateModel
{
    public string Keyword { get; set; } = string.Empty;
    public string UrlSlug { get; set; } = string.Empty;
}