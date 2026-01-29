using LoLStore.Core.Constants;

public interface IPagingParams
{
    int? PageSize { get; set; }
    int? PageNumber { get; set; }
    string? SortColumn { get; set; }
    SortOrder? SortOrder { get; set; } 
}