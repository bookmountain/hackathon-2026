using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using StackExchange.Redis;
using UniMap.Api.Contracts;
using UniMap.Api.Data;
using UniMap.Api.Domain;

namespace UniMap.Api.Services;

/// <summary>
/// Simple weighted-similarity matcher. Good enough for a demo; tweak the weights or swap the
/// whole thing out (e.g. pgvector embeddings) without touching the controllers.
/// </summary>
public class MatchingService(AppDbContext db, IConnectionMultiplexer redis, StorageService storage)
{
    private const double HabitWeight = 40, InterestWeight = 30, DegreeWeight = 10, DepartmentWeight = 10,
        UniWeight = 5, YearWeight = 5;
    private static readonly TimeSpan CacheTtl = TimeSpan.FromMinutes(5);
    private readonly IDatabase _cache = redis.GetDatabase();

    public static string CacheKey(Guid userId) => $"suggestions:{userId}";

    public async Task InvalidateAsync(Guid userId) => await _cache.KeyDeleteAsync(CacheKey(userId));

    public async Task<List<BuddySuggestion>> SuggestAsync(Guid userId, int limit, CancellationToken ct)
    {
        var cached = await _cache.StringGetAsync(CacheKey(userId));
        if (cached.HasValue)
            return JsonSerializer.Deserialize<List<BuddySuggestion>>(cached.ToString())!.Take(limit).ToList();

        var me = await db.Profiles.AsNoTracking().Include(p => p.User).Include(p => p.Degree)
            .FirstOrDefaultAsync(p => p.UserId == userId, ct);
        if (me is null) return [];

        // Anyone we already have a connection with (either direction) is excluded.
        var connected = await db.BuddyConnections.AsNoTracking()
            .Where(c => c.RequesterId == userId || c.AddresseeId == userId)
            .Select(c => c.RequesterId == userId ? c.AddresseeId : c.RequesterId)
            .ToListAsync(ct);

        var candidates = await db.Profiles.AsNoTracking().Include(p => p.User).Include(p => p.Degree)
            .Where(p => p.UserId != userId && !connected.Contains(p.UserId))
            .ToListAsync(ct);

        var ranked = candidates
            .Select(c => Score(me, c))
            .Where(s => s.Score > 0)
            .OrderByDescending(s => s.Score)
            .Take(50)
            .ToList();

        await _cache.StringSetAsync(CacheKey(userId), JsonSerializer.Serialize(ranked), CacheTtl);
        return ranked.Take(limit).ToList();
    }

    private BuddySuggestion Score(Profile me, Profile other)
    {
        var sharedHabits = me.Habits.Intersect(other.Habits).ToList();
        var sharedInterests = me.Interests.Intersect(other.Interests).ToList();

        double score = HabitWeight * Jaccard(me.Habits, other.Habits)
                     + InterestWeight * Jaccard(me.Interests, other.Interests);
        if (me.DegreeId is not null && me.DegreeId == other.DegreeId) score += DegreeWeight;
        if (string.Equals(me.Department, other.Department, StringComparison.OrdinalIgnoreCase)) score += DepartmentWeight;
        if (me.User.University == other.User.University) score += UniWeight;
        if (me.YearOfStudy is not null && me.YearOfStudy == other.YearOfStudy) score += YearWeight;

        return new BuddySuggestion(ToDto(other, storage), Math.Round(score, 1), sharedHabits, sharedInterests);
    }

    private static double Jaccard(List<string> a, List<string> b)
    {
        if (a.Count == 0 || b.Count == 0) return 0;
        var inter = a.Intersect(b).Count();
        var union = a.Union(b).Count();
        return (double)inter / union;
    }

    public static ProfileDto ToDto(Profile p, StorageService storage) => new(
        p.UserId, p.DisplayName, p.User.University,
        p.Degree is null ? null : new DegreeSummary(p.Degree.Id, p.Degree.Name, p.Degree.Level, p.Degree.College),
        p.Department, p.Gender, p.Pronouns, p.YearOfStudy, p.Bio,
        p.Habits, p.Interests, storage.ReadUrl(p.AvatarKey));
}
