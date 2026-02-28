using LoLStore.Core.Entities;

namespace LoLStore.API.Models.UserModel;

public class UserDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string UserName { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public string? Address { get; set; }
    public DateTime CreatedAt { get; set; }
    public IList<RoleDto> Roles { get; set; } = new List<RoleDto>();
    public string PrimaryRole { get; set; } = string.Empty;

    public BanStatus BanStatus { get; set; }
    public DateTime? BannedUntil { get; set; }
    public string? BanReason { get; set; }
    public bool IsBanned { get; set; }
}

public class UserAdminDto : UserDto
{
    public DateTime? UpdatedAt { get; set; }
    public bool IsDeleted { get; set; }
    public DateTime? DeletedAt { get; set; }
}

public class RoleDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
}

public class UserLoginModel
{
    public string UserName { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
}