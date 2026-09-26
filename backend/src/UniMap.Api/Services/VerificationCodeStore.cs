using System.Security.Cryptography;
using StackExchange.Redis;

namespace UniMap.Api.Services;

/// <summary>Short-lived email verification codes, kept in Redis with a TTL.</summary>
public class VerificationCodeStore(IConnectionMultiplexer redis)
{
    private static readonly TimeSpan Ttl = TimeSpan.FromMinutes(15);
    private const int MaxAttempts = 5;
    private readonly IDatabase _db = redis.GetDatabase();

    private static string CodeKey(string email) => $"verify:{email}:code";
    private static string AttemptsKey(string email) => $"verify:{email}:attempts";

    public async Task<string> CreateAsync(string email)
    {
        var code = RandomNumberGenerator.GetInt32(0, 1_000_000).ToString("D6");
        await _db.StringSetAsync(CodeKey(email), code, Ttl);
        await _db.KeyDeleteAsync(AttemptsKey(email));
        return code;
    }

    public async Task<bool> ConsumeAsync(string email, string code)
    {
        var attempts = await _db.StringIncrementAsync(AttemptsKey(email));
        await _db.KeyExpireAsync(AttemptsKey(email), Ttl);
        if (attempts > MaxAttempts) return false;

        var stored = await _db.StringGetAsync(CodeKey(email));
        if (stored.IsNullOrEmpty || stored != code.Trim()) return false;

        await _db.KeyDeleteAsync([CodeKey(email), AttemptsKey(email)]);
        return true;
    }
}
