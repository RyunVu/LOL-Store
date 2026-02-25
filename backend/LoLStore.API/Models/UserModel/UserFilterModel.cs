namespace LoLStore.API.Models.UserModel;

public class UserFilterModel : PagingModel
{
    public string? Keyword {get;set;}
}

public class UserManagerFilterModel : UserFilterModel
{
    public bool? IsBanned { get; set; }
    public bool? IsDeleted { get; set; }
}