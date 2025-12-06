namespace LoLStore.API.Models;

public class RegisterModel
{
    public string UserName { get; set; }
    public string Email { get; set; }
    public string Password { get; set; }
}

public class UserRolesEditModel
{
    public Guid UserId { get; set; }
    public IList<Guid> RolesId { get; set; }
}