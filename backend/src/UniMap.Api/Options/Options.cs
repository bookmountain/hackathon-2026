using UniMap.Api.Domain;

namespace UniMap.Api.Options;

public class JwtOptions
{
    public string Issuer { get; set; } = "unimap";
    public string Audience { get; set; } = "unimap";
    public required string Key { get; set; }
    public int ExpiryHours { get; set; } = 24 * 7;
}

public class UniversityOptions
{
    /// <summary>Email domain -> university. Subdomains match too (e.g. student.adelaide.edu.au).</summary>
    public Dictionary<string, University> Domains { get; set; } = [];

    public University? Resolve(string email)
    {
        var at = email.LastIndexOf('@');
        if (at < 0) return null;
        var host = email[(at + 1)..].ToLowerInvariant();
        foreach (var (domain, uni) in Domains)
        {
            var d = domain.ToLowerInvariant();
            if (host == d || host.EndsWith("." + d)) return uni;
        }
        return null;
    }
}

public class R2Options
{
    public string? AccountId { get; set; }
    public string? AccessKeyId { get; set; }
    public string? SecretAccessKey { get; set; }
    public string? Bucket { get; set; }
    /// <summary>Public base URL for reads, e.g. https://pub-xxxx.r2.dev or a custom domain.</summary>
    public string? PublicBaseUrl { get; set; }

    public bool IsConfigured =>
        !string.IsNullOrWhiteSpace(AccountId) && !string.IsNullOrWhiteSpace(AccessKeyId) &&
        !string.IsNullOrWhiteSpace(SecretAccessKey) && !string.IsNullOrWhiteSpace(Bucket);
}
