namespace LoLStore.Core.Queries;

public class UserQuery
{
    public string? Keyword { get; set; }
    public bool? IsBanned { get; set; }
    public bool? IsDeleted { get; set; }
}