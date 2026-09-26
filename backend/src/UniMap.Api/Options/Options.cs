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

/// <summary>Claude, for photo analysis (the Sell and "List a room" forms, search by photo).</summary>
public class AnthropicOptions
{
    public string? ApiKey { get; set; }
    public string Model { get; set; } = "claude-opus-5";

    public bool IsConfigured => !string.IsNullOrWhiteSpace(ApiKey);
}

public class EmailOptions
{
    /// <summary>SMTP host. Leave empty to just log codes instead of sending.</summary>
    public string? Host { get; set; }
    public int Port { get; set; } = 587;
    public string? Username { get; set; }
    public string? Password { get; set; }
    /// <summary>"auto" (STARTTLS on 587, TLS on 465), "none" for local Mailpit.</summary>
    public string Security { get; set; } = "auto";
    public string From { get; set; } = "UniMap <no-reply@example.com>";

    public bool IsConfigured => !string.IsNullOrWhiteSpace(Host);
}
