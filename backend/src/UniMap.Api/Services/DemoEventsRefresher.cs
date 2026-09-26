using UniMap.Api.Data;

namespace UniMap.Api.Services;

/// <summary>
/// Hourly, moves finished seeded meetups to next week (<see cref="DevSeeder.RollSeedEventsAsync"/>), so a
/// demo server that runs for days still has upcoming events. Only registered when demo data is seeded.
/// </summary>
public class DemoEventsRefresher(IServiceScopeFactory scopes, ILogger<DemoEventsRefresher> logger) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        using var timer = new PeriodicTimer(TimeSpan.FromHours(1));
        while (await timer.WaitForNextTickAsync(stoppingToken))
        {
            try
            {
                using var scope = scopes.CreateScope();
                await DevSeeder.RollSeedEventsAsync(scope.ServiceProvider.GetRequiredService<AppDbContext>(), logger);
            }
            catch (Exception e) when (e is not OperationCanceledException)
            {
                logger.LogError(e, "Couldn't move finished seeded meetups");
            }
        }
    }
}
