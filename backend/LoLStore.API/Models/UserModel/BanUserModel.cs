namespace LoLStore.API.Models.UserModel;

public class BanUserModel
{
    public Guid UserId { get; set; }
    public bool IsPermanent { get; set; }
    public int? DurationDays { get; set; }
    public string? BanReason { get; set; }
}