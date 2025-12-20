namespace LoLStore.API.Models.UserModel;

public class UserEditModel
{
    public string Name {get;set;} = string.Empty;
    public string Email {get;set;} = string.Empty;
    public string? Phone {get;set;}
    public string? Address {get;set;}
}