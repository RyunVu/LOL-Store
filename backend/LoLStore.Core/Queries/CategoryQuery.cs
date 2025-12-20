namespace LoLStore.Core.Queries;

public class CategoryQuery
{
    public string? Keyword { get; set; }
    public string? UrlSlug { get; set; } 
    public bool? ShowOnMenu { get; set; }
    public bool? IsDeleted { get; set; }
}