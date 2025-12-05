using LoLStore.Core.Entities;

namespace LoLStore.Core.DTO;

public class LoginResult
{
    public LoginStatus Status { get; set; }
    public User AuthenticatedUser { get; set; }
    public bool IsSuccess => Status == LoginStatus.Success;
}