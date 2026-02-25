using LoLStore.Core.DTO;
using LoLStore.Core.Entities;
using LoLStore.Core.Queries;

namespace LoLStore.Services.Shop;

public interface IUserRepository
{
    Task<LoginResult> LoginAsync(User userLogin, CancellationToken cancellationToken = default);

    Task<bool> DeleteRefreshTokenAsync(string refreshToken, CancellationToken cancellationToken = default);

    Task<UserRefreshToken?> GetRefreshTokenAsync(string refreshToken, CancellationToken cancellationToken= default);

    Task<User?> GetUserByIdAsync(Guid id, bool getFull = false, CancellationToken cancellationToken = default);

    Task<bool> ChangePasswordAsync(User user, string oldPassword, string newPassword, CancellationToken cancellationToken = default);

    Task<User?> RegisterAsync(User user, CancellationToken cancellationToken = default);

    Task<Role?> GetRoleByNameAsync(string role, CancellationToken cancellationToken = default);
    Task<IList<Role>> GetRolesAsync(CancellationToken cancellationToken = default);

    Task<bool> IsUserExistedAsync(String userName, CancellationToken cancellationToken = default);

    Task<User?> UpdateUserRolesAsync (Guid userId, IList<Guid> roles, CancellationToken cancellationToken = default);

    Task<UserRefreshToken> SetRefreshTokenAsync(Guid userId, IRefreshToken refreshToken, CancellationToken cancellationToken = default);

    Task<User?> GetUserRefreshTokenAsync(string refreshToken, CancellationToken cancellationToken = default);
    Task<IPagedList<T>> GetPagedUsersAsync<T>(
        UserQuery query,
        IPagingParams pagingParams,
        Func<IQueryable<User>, IQueryable<T>> mapper,
        CancellationToken cancellationToken = default);

    Task<bool> BanUserAsync(Guid userId, bool isPermanent, int? durationDays, string? reason, CancellationToken cancellationToken = default);
    Task<bool> UnbanUserAsync(Guid userId, CancellationToken cancellationToken = default);

    Task<IPagedList<T>> GetPagedOrdersByUserAsync<T>(
        Guid userId,
        IPagingParams pagingParams,
        Func<IQueryable<Order>, IQueryable<T>> mapper,
        CancellationToken cancellationToken = default);
}