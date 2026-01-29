using LoLStore.Core.Constants;

namespace LoLStore.Core.Queries;

public class CategoryQuery
{
    public string? Keyword { get; set; }
    public string? UrlSlug { get; set; } 
    public bool? IsActive { get; set; }
    public bool? IsDeleted { get; set; }
    public DateFilterType? DateFilter { get; set; }    
    public SortOrder SortOrder { get; set; } = SortOrder.Desc;
}