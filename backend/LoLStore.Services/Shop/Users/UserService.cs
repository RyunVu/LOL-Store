using LoLStore.Core.DTO.Users;
using LoLStore.Core.Entities;

namespace LoLStore.Services.Shop.Users;

public class UserService : IUserService
{
    private readonly IUserRepository _repository;

    public UserService(IUserRepository repository)
    {
        _repository = repository;
    }

    public async Task<User?> RegisterAsync(
        CreateUserDto dto,
        CancellationToken cancellationToken = default)
    {
        // Validate username uniqueness
        if (await _repository.IsUserExistedAsync(dto.UserName, cancellationToken))
            throw new InvalidOperationException($"Username '{dto.UserName}' is already taken.");

        var user = new User
        {
            UserName = dto.UserName,
            Email = dto.Email,
            Password = dto.Password,   // hashing is handled inside RegisterAsync
            Name = dto.UserName        // default Name to UserName, same as repo logic
        };

        return await _repository.RegisterAsync(user, cancellationToken);
    }

    public async Task<bool> UpdateAsync(
        UpdateUserDto dto,
        CancellationToken cancellationToken = default)
    {
        var user = await _repository.GetUserByIdAsync(dto.Id, false, cancellationToken);
        if (user == null)
            return false;

        user.Name = dto.Name;
        user.Email = dto.Email;
        user.Phone = dto.Phone;
        user.Address = dto.Address;

        return await _repository.UpdateUserAsync(user, cancellationToken);
    }

    public async Task<bool> ToggleSoftDeleteAsync(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        var user = await _repository.GetUserByIdAsync(id, false, cancellationToken);
        if (user == null)
            return false;

        return await _repository.ToggleDeleteUserAsync(id, cancellationToken);
    }

    public async Task<bool> ChangePasswordAsync(
        Guid userId,
        string oldPassword,
        string newPassword,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(newPassword))
            throw new InvalidOperationException("New password cannot be empty.");

        var user = await _repository.GetUserByIdAsync(userId, false, cancellationToken);
        if (user == null)
            return false;

        return await _repository.ChangePasswordAsync(user, oldPassword, newPassword, cancellationToken);
    }

    public async Task<bool> ResetPasswordAsync(
        Guid userId,
        string newPassword,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(newPassword))
            throw new InvalidOperationException("New password cannot be empty.");

        var user = await _repository.GetUserByIdAsync(userId, false, cancellationToken);
        if (user == null)
            return false;

        return await _repository.ResetPasswordAsync(user, newPassword, cancellationToken);
    }

    public async Task<bool> UpdateRolesAsync(
        Guid userId,
        IList<Guid> roleIds,
        CancellationToken cancellationToken = default)
    {
        if (roleIds == null || roleIds.Count == 0)
            throw new InvalidOperationException("At least one role must be assigned.");

        var user = await _repository.UpdateUserRolesAsync(userId, roleIds, cancellationToken);
        return user != null;
    }

    public async Task<bool> BanAsync(
        Guid userId,
        bool isPermanent,
        int? durationDays,
        string? reason,
        CancellationToken cancellationToken = default)
    {
        if (!isPermanent && (!durationDays.HasValue || durationDays <= 0))
            throw new InvalidOperationException("Temporary ban requires a valid duration in days.");

        var user = await _repository.GetUserByIdAsync(userId, false, cancellationToken);
        if (user == null)
            return false;

        if (user.IsBanned)
            throw new InvalidOperationException("User is already banned.");

        return await _repository.BanUserAsync(userId, isPermanent, durationDays, reason, cancellationToken);
    }

    public async Task<bool> UnbanAsync(
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        var user = await _repository.GetUserByIdAsync(userId, false, cancellationToken);
        if (user == null)
            return false;

        if (!user.IsBanned)
            throw new InvalidOperationException("User is not currently banned.");

        return await _repository.UnbanUserAsync(userId, cancellationToken);
    }
}