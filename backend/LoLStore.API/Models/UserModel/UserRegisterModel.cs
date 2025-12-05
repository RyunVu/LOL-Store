namespace LoLStore.API.Models.UserModel;

public class UserRegisterModel
{
    public string Email {get;set;}
    public string UserName {get;set;}
    public string Password {get;set;}
}

public class UserRolesEditModel
{
    public Guid UserId {get;set;}
    public IList<Guid> RolesIdList {get;set;}
}