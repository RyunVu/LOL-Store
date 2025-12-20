namespace LoLStore.API.Models;

public class PagingModel : IPagingParams
{
    public int? PageSize { get; set; } = 20;
    public int? PageNumber { get; set; } = 1;
    public string? SortColumn { get; set; }
    public string? SortOrder { get; set; }
}