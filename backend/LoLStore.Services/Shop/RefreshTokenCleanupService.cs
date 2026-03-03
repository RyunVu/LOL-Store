using LoLStore.Core.Entities;
using LoLStore.Data.Contexts;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace LoLStore.Services.Shop;

public class RefreshTokenCleanupService : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<RefreshTokenCleanupService> _logger;

    // Run cleanup every 24 hours
    private readonly TimeSpan _interval = TimeSpan.FromHours(24);

    public RefreshTokenCleanupService(
        IServiceScopeFactory scopeFactory,
        ILogger<RefreshTokenCleanupService> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        await Task.Delay(TimeSpan.FromMinutes(5), stoppingToken);
        
        while (!stoppingToken.IsCancellationRequested)
        {
            await CleanupAsync(stoppingToken);
            await Task.Delay(_interval, stoppingToken);
        }
    }

    private async Task CleanupAsync(CancellationToken ct)
    {
        try
        {
            using var scope = _scopeFactory.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<StoreDbContext>();

            var cutoff = DateTime.UtcNow;

            var deleted = await context.Set<UserRefreshToken>()
                .Where(t => t.Expires <= cutoff || t.IsRevoked)
                .ExecuteDeleteAsync(ct);

            if (deleted > 0)
                _logger.LogInformation("Cleaned up {Count} expired/revoked refresh tokens.", deleted);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during refresh token cleanup.");
        }
    }
}