using LoLStore.Core.DTO.Users;
using LoLStore.Core.Entities;

namespace LoLStore.Services.Shop.Users;

public interface IUserService
{
    // Account lifecycle
    Task<User?> RegisterAsync(
        CreateUserDto dto,
        CancellationToken cancellationToken = default);

    Task<bool> UpdateAsync(
        UpdateUserDto dto,
        CancellationToken cancellationToken = default);

    Task<bool> ToggleSoftDeleteAsync(
        Guid id,
        CancellationToken cancellationToken = default);

    // Password management
    Task<bool> ChangePasswordAsync(
        Guid userId,
        string oldPassword,
        string newPassword,
        CancellationToken cancellationToken = default);

    Task<bool> ResetPasswordAsync(
        Guid userId,
        string newPassword,
        CancellationToken cancellationToken = default);

    // Role management
    Task<bool> UpdateRolesAsync(
        Guid userId,
        IList<Guid> roleIds,
        CancellationToken cancellationToken = default);

    // Ban management
    Task<bool> BanAsync(
        Guid userId,
        bool isPermanent,
        int? durationDays,
        string? reason,
        CancellationToken cancellationToken = default);

    Task<bool> UnbanAsync(
        Guid userId,
        CancellationToken cancellationToken = default);
}