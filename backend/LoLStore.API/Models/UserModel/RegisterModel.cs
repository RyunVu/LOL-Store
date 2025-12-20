namespace LoLStore.API.Models.UserModel;

public class RegisterModel
{
    public string UserName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
}

public class UserRolesEditModel
{
    public Guid UserId { get; set; }
    public IList<Guid> RolesId { get; set; } = new List<Guid>();
}