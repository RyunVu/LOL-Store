using LoLStore.Core.DTO;
using LoLStore.Core.Entities;
using LoLStore.Core.Queries;
using LoLStore.Data.Contexts;
using LoLStore.Services.Extensions;
using Microsoft.EntityFrameworkCore;

namespace LoLStore.Services.Shop.Users;

public class UserRepository : IUserRepository
{
    private readonly StoreDbContext _context;
    private readonly IPasswordHasher _hasher;

    public UserRepository(StoreDbContext context, IPasswordHasher hasher)
    {
        _context = context;
        _hasher = hasher;
    }

    public async Task<LoginResult> LoginAsync(User userLogin, CancellationToken cancellationToken = default)
    {
        var user = await _context.Users
            .Include(r => r.Roles)
            .FirstOrDefaultAsync(
                u => u.UserName.ToLower() == userLogin.UserName.ToLower(),
                cancellationToken);

        if (user == null)
            return new LoginResult { Status = LoginStatus.InvalidUsername };

        if (!_hasher.VerifyPassword(user.Password, userLogin.Password))
            return new LoginResult { Status = LoginStatus.InvalidPassword };

        if (user.IsBanned)
            return new LoginResult
            {
                Status = LoginStatus.Banned,
                BanStatus = user.BanStatus,
                BannedUntil = user.BannedUntil,
                BanReason = user.BanReason
            };

        return new LoginResult
        {
            Status = LoginStatus.Success,
            AuthenticatedUser = user
        };
    }

    public async Task<bool> DeleteRefreshTokenAsync(string refreshToken, CancellationToken cancellationToken = default)
    {
        return await _context.Set<UserRefreshToken>()
            .Where(x => x.Token == refreshToken)
            .ExecuteDeleteAsync(cancellationToken) > 0;
    }

    public async Task<UserRefreshToken?> GetRefreshTokenAsync(string refreshToken, CancellationToken cancellationToken = default)
    {
        return await _context.Set<UserRefreshToken>()
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Token == refreshToken, cancellationToken);
    }

    public async Task<User?> GetUserByIdAsync(Guid id, bool getFull = false, CancellationToken cancellationToken = default)
    {
        if (getFull)
        {
            return await _context
                .Set<User>()
                .Include(u => u.Roles)
                .FirstOrDefaultAsync(u => u.Id == id, cancellationToken);
        }

        return await _context.Set<User>()
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Id == id, cancellationToken);
    }

    public async Task<bool> ChangePasswordAsync(User user, string oldPassword, string newPassword, CancellationToken cancellationToken = default)
    {
        var trackedUser = await _context.Users
         .FirstOrDefaultAsync(u => u.Id == user.Id, cancellationToken);

        if (trackedUser == null || !_hasher.VerifyPassword(trackedUser.Password, oldPassword))
            return false;

        trackedUser.Password = _hasher.HashPassword(newPassword);
        trackedUser.UpdatedAt = DateTime.UtcNow;

        return await _context.SaveChangesAsync(cancellationToken) > 0;
    }

    
    public async Task<bool> ResetPasswordAsync(User user, string newPassword, CancellationToken cancellationToken = default)
    {
        if (user == null)
            return false;
        
        user.Password = _hasher.HashPassword(newPassword);
        _context.Users.Update(user);
        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<User?> RegisterAsync(User user, CancellationToken cancellationToken = default)
    {
        if (await _context.Users.AnyAsync(u => u.UserName == user.UserName, cancellationToken))
            return null;
        user.Name = user.Name ?? user.UserName;  
        user.CreatedAt = DateTime.UtcNow;
        user.Password = _hasher.HashPassword(user.Password);

        // Find default role
        var defaultRole = await _context.Roles.FirstOrDefaultAsync(r => r.Name == "User", cancellationToken);

        if (defaultRole == null)
            throw new Exception("Default role 'User' not found in database.");

        user.Roles = new List<Role> { defaultRole };

        _context.Users.Add(user);
        await _context.SaveChangesAsync(cancellationToken);

        return user;
    }

    public async Task<Role?> GetRoleByNameAsync(string role, CancellationToken cancellationToken = default)
    {
        return await _context.Set<Role>()
            .Include(u => u.Users)
            .AsNoTracking()
            .FirstOrDefaultAsync(r => r.Name.Equals(role), cancellationToken);
    }

    public async Task<bool> IsUserExistedAsync(string userName, CancellationToken cancellationToken = default)
    {
        return await _context.Set<User>()
            .AnyAsync(u => u.UserName == userName, cancellationToken);
    }

    public async Task<IList<Role>> GetRolesAsync(CancellationToken cancellationToken = default)
    {
        return await _context.Set<Role>()
            .ToListAsync(cancellationToken);
    }
    
    public async Task<User?> UpdateUserRolesAsync(Guid userId, IList<Guid> roles, CancellationToken cancellationToken = default)
    {
        var user = await _context.Set<User>()
            .Include(r => r.Roles)
            .FirstOrDefaultAsync(u => u.Id == userId, cancellationToken);

        if (user == null)
            return null;
            
        UpdateUserRoles(user, roles);

        _context.Entry(user).State = EntityState.Modified;
        await _context.SaveChangesAsync(cancellationToken);

        return user;
    }

    public bool UpdateUserRoles(User user, IEnumerable<Guid> selectedRoleIds)
    {
        if (selectedRoleIds == null) return false;

        // Convert to HashSet for O(1) lookup
    var selectedIds = new HashSet<Guid>(selectedRoleIds);

    // Current role IDs
    var currentIds = new HashSet<Guid>(user.Roles.Select(r => r.Id));

    // --- Add new roles ---
    var rolesToAdd = selectedIds.Except(currentIds).ToList();
    if (rolesToAdd.Count > 0)
    {
        var addRoles = _context.Roles
            .Where(r => rolesToAdd.Contains(r.Id))
            .ToList();

        foreach (var r in addRoles)
            user.Roles.Add(r);
    }

    // --- Remove unselected roles ---
    var rolesToRemove = currentIds.Except(selectedIds).ToList();
    if (rolesToRemove.Count > 0)
    {
        user.Roles = user.Roles
            .Where(r => !rolesToRemove.Contains(r.Id))
            .ToList();
    }

    return true;
    }

    public async Task<UserRefreshToken> SetRefreshTokenAsync(Guid userId, IRefreshToken refreshToken, CancellationToken cancellationToken = default)
    {        
        var tokenEntity = new UserRefreshToken
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            Token = refreshToken.Token,
            Created = refreshToken.Created,
            Expires = refreshToken.Expires
        };

        _context.UserRefreshTokens.Add(tokenEntity);
        await _context.SaveChangesAsync(cancellationToken);

        return tokenEntity;
    }

    public async Task<IPagedList<T>> GetPagedUsersAsync<T>(UserQuery query, IPagingParams pagingParams, Func<IQueryable<User>, IQueryable<T>> mapper, CancellationToken cancellationToken = default)
    {
        var users = FilterUser(query);

        var projectedUser = mapper(users);

        return await projectedUser.ToPagedListAsync(pagingParams, cancellationToken);
    }

    private IQueryable<User> FilterUser(UserQuery query)
    {
        var keyword = query.Keyword?.Trim();

        return _context.Set<User>()
        .AsNoTracking()
        .WhereIf(!string.IsNullOrWhiteSpace(keyword), u =>
            (u.Address ?? string.Empty).Contains(keyword!) ||
            (u.Email ?? string.Empty).Contains(keyword!) ||
            (u.Name ?? string.Empty).Contains(keyword!) ||
            (u.UserName ?? string.Empty).Contains(keyword!))
        .WhereIf(query.IsDeleted.HasValue, u => u.IsDeleted == query.IsDeleted!.Value)
        .WhereIf(query.IsBanned.HasValue, u =>
            query.IsBanned!.Value
                ? u.BanStatus != BanStatus.None
                : u.BanStatus == BanStatus.None);
    }

    public async Task<User?> GetUserRefreshTokenAsync(string refreshToken, CancellationToken cancellationToken = default)
    {
        var userLogin = await _context.Set<UserRefreshToken>()
			.FirstOrDefaultAsync(s => s.Token.Equals(refreshToken), cancellationToken);

		if (userLogin == null)
		{
			return null;
		}

		return await _context.Set<User>()
            .Include(s => s.RefreshTokens)
            .Include(s => s.Roles)
            .FirstOrDefaultAsync(s => s.Id == userLogin.UserId, cancellationToken);
    }

    public async Task<bool> BanUserAsync(Guid userId, bool isPermanent, int? durationDays, string? reason, CancellationToken cancellationToken = default)
    {
        var user = await _context.Set<User>()
        .FirstOrDefaultAsync(u => u.Id == userId, cancellationToken);

        if (user == null) return false;

        user.BanStatus = isPermanent ? BanStatus.Permanent : BanStatus.Temporary;
        user.BannedUntil = isPermanent ? null : DateTime.UtcNow.AddDays(durationDays ?? 7);
        user.BanReason = reason;

        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<bool> UnbanUserAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        var user = await _context.Set<User>()
            .FirstOrDefaultAsync(u => u.Id == userId, cancellationToken);

        if (user == null) return false;

        user.BanStatus = BanStatus.None;
        user.BannedUntil = null;
        user.BanReason = null;

        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<IPagedList<T>> GetPagedOrdersByUserAsync<T>(
        Guid userId,
        IPagingParams pagingParams,
        Func<IQueryable<Order>, IQueryable<T>> mapper,
        CancellationToken cancellationToken = default)
    {
        var orders = _context.Set<Order>()
            .AsNoTracking()
            .Where(o => o.UserId == userId)
            .Include(o => o.OrderItems)
                .ThenInclude(oi => oi.Product)
                    .ThenInclude(p => p!.Pictures)
            .Include(o => o.Discount)
            .OrderByDescending(o => o.OrderDate);

        var projected = mapper(orders);

        return await projected.ToPagedListAsync(pagingParams, cancellationToken);
    }

    

    public async Task<List<T>> GetRecentOrdersByUserAsync<T>(
        Guid userId,
        int recentDays,
        Func<IQueryable<Order>, IQueryable<T>> mapper,
        CancellationToken cancellationToken = default)
    {
        var recentDate = DateTime.UtcNow.AddDays(-recentDays);
        var cancelledCutoff = DateTime.UtcNow.AddDays(-30);

        var query = _context.Set<Order>()
            .AsNoTracking()
            .Where(o => o.UserId == userId && o.OrderDate >= recentDate)
            // Hide cancelled orders older than 30 days
            .Where(o =>
                o.Status != OrderStatus.Cancelled ||
                o.OrderDate >= cancelledCutoff)
            .OrderByDescending(o => o.OrderDate);

        return await mapper(query).ToListAsync(cancellationToken);
    }

    public async Task<bool> UpdateUserAsync(
        User user,
        CancellationToken cancellationToken = default)
    {
        var existingUser = await _context.Users
            .FirstOrDefaultAsync(u => u.Id == user.Id, cancellationToken);

        if (existingUser == null)
            return false;

        existingUser.Name = user.Name;
        existingUser.Email = user.Email;
        existingUser.Phone = user.Phone;
        existingUser.Address = user.Address;
        existingUser.UpdatedAt = DateTime.UtcNow;

        return await _context.SaveChangesAsync(cancellationToken) > 0;
    }

    public async Task<bool> ToggleDeleteUserAsync(
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        var user = await _context.Set<User>()
            .FirstOrDefaultAsync(u => u.Id == userId, cancellationToken);

        if (user == null)
            return false;

        user.IsDeleted = !user.IsDeleted;
        user.UpdatedAt = DateTime.UtcNow;

        if (user.IsDeleted)
        {
            user.DeletedAt = DateTime.UtcNow;
        }
        else
        {
            user.DeletedAt = null;
        }

        return await _context.SaveChangesAsync(cancellationToken) > 0;
    }

    public async Task<bool> RevokeRefreshTokenAsync(string token, string reason, string? replacedByToken = null, CancellationToken cancellationToken = default)
    {
        var entity = await _context.Set<UserRefreshToken>()
            .FirstOrDefaultAsync(t => t.Token == token, cancellationToken);

        if (entity == null || !entity.IsActive)
            return false;

        entity.IsRevoked = true;
        entity.RevokedAt = DateTime.UtcNow;
        entity.RevokedReason = reason;
        entity.ReplacedByToken = replacedByToken;

        return await _context.SaveChangesAsync(cancellationToken) > 0;
    }

    public async Task RevokeAllUserRefreshTokensAsync(Guid userId, string reason, CancellationToken cancellationToken = default)
    {
        var activeTokens = await _context.Set<UserRefreshToken>()
        .Where(t => t.UserId == userId && !t.IsRevoked && t.Expires > DateTime.UtcNow)
        .ToListAsync(cancellationToken);

        foreach (var token in activeTokens)
        {
            token.IsRevoked = true;
            token.RevokedAt = DateTime.UtcNow;
            token.RevokedReason = reason;
        }
        await _context.SaveChangesAsync(cancellationToken);
    }

    public async Task<UserRefreshToken?> GetActiveRefreshTokenByUserIdAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        return await _context.Set<UserRefreshToken>()
            .AsNoTracking()
            .FirstOrDefaultAsync(t => t.UserId == userId && !t.IsRevoked && t.Expires > DateTime.UtcNow, cancellationToken);
    }
}