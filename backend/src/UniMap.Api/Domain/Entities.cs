namespace UniMap.Api.Domain;

public enum University { Adelaide, Flinders }

public enum Gender { Male, Female, NonBinary, Other, PreferNotToSay }

public enum ConnectionStatus { Pending, Accepted, Declined }

public class User
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public required string Email { get; set; }
    public required string PasswordHash { get; set; }
    public University University { get; set; }
    public bool EmailVerified { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

    public Profile? Profile { get; set; }
}

/// <summary>Onboarding questionnaire answers. Created once the user finishes onboarding.</summary>
public class Profile
{
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;

    public required string DisplayName { get; set; }
    public required string Department { get; set; }
    public Gender Gender { get; set; }
    public int? YearOfStudy { get; set; }
    public string? Bio { get; set; }

    /// <summary>Lower-cased tags, e.g. "early-bird", "gym", "non-smoker". Stored as Postgres text[].</summary>
    public List<string> Habits { get; set; } = [];
    public List<string> Interests { get; set; } = [];

    /// <summary>Object key in R2 (not a full URL).</summary>
    public string? AvatarKey { get; set; }

    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;
}

public class BuddyConnection
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid RequesterId { get; set; }
    public User Requester { get; set; } = null!;
    public Guid AddresseeId { get; set; }
    public User Addressee { get; set; } = null!;
    public ConnectionStatus Status { get; set; } = ConnectionStatus.Pending;
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
}
