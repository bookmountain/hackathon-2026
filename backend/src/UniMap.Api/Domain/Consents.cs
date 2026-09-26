namespace UniMap.Api.Domain;

/// <summary>The four checkboxes on the UCompass "Before you start" screen.</summary>
public enum ConsentType { Terms, Location, AgeAndEnrolment, UsageStats }

/// <summary>
/// Append-only log: every grant or withdrawal is a new row, so we can show what someone agreed to
/// and when (Australian Privacy Principles). The current state is the latest row per type.
/// </summary>
public class ConsentRecord
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;
    public ConsentType Type { get; set; }
    public bool Granted { get; set; }
    /// <summary>Which wording was agreed to. Bumping <see cref="ConsentPolicy.Version"/> asks everyone again.</summary>
    public required string PolicyVersion { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
}

public record ConsentDefinition(ConsentType Type, string Label, bool Required);

public static class ConsentPolicy
{
    public const string Version = "2026-09-26";
    /// <summary>Error code the app can check for to send the user back to the consent screen.</summary>
    public const string ConsentRequiredCode = "consent_required";

    /// <summary>Policy for endpoints that only need a login (auth-adjacent screens, consent itself).</summary>
    public const string SignedInOnly = "SignedInOnly";

    /// <summary>Wording from the prototype.</summary>
    public static readonly ConsentDefinition[] All =
    [
        new(ConsentType.Terms, "I agree to the Terms of Use and Privacy Policy", true),
        new(ConsentType.Location, "Use my approximate campus-zone location on the map", true),
        new(ConsentType.AgeAndEnrolment, "I'm 18+ and currently enrolled at Adelaide Uni or Flinders", true),
        new(ConsentType.UsageStats, "Share anonymous usage stats to improve UCompass", false),
    ];

    public static readonly ConsentType[] Required = All.Where(c => c.Required).Select(c => c.Type).ToArray();
}
