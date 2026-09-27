using System.Text.Json.Serialization;

namespace UniMap.Api.Domain;

public enum University { Adelaide, Flinders }

public enum Gender { Male, Female, NonBinary, Other, PreferNotToSay }

/// <summary>A range rather than a birth date, so we store as little personal data as possible.</summary>
public enum AgeRange
{
    [JsonStringEnumMemberName("under-18")] Under18,
    [JsonStringEnumMemberName("18-20")] From18To20,
    [JsonStringEnumMemberName("21-24")] From21To24,
    [JsonStringEnumMemberName("25-29")] From25To29,
    [JsonStringEnumMemberName("30+")] Over30,
}

/// <summary>The avatar builder's mode. Its third mode, "Anonymous", is <see cref="Profile.AvatarPreset"/> = null.</summary>
public enum AvatarMode { Initials, Icon }

/// <summary>The avatar builder's icons, in the design's order.</summary>
public enum AvatarIcon { Compass, Book, Coffee, Music, Code, Leaf, Camera, Ball, Paw, Rocket }

/// <summary>The avatar builder's shapes.</summary>
public enum AvatarShape { Circle, Soft, Square }

/// <summary>The avatar builder's ring colour around the avatar.</summary>
public enum AvatarRing { None, Gold, Blue, Navy, Sky }

/// <summary>Grouping for the degree dropdowns. Honours years are folded into Undergraduate.</summary>
public enum DegreeLevel { Undergraduate, Postgraduate, Research }

/// <summary>Reference data: real courses, loaded from Data/Seed/*.csv on startup.</summary>
public class Degree
{
    public int Id { get; set; }
    public University University { get; set; }
    public DegreeLevel Level { get; set; }
    /// <summary>As the uni writes it, e.g. "Bachelor", "Graduate Certificate", "Master".</summary>
    public required string AwardType { get; set; }
    public required string Name { get; set; }
    /// <summary>College/faculty. "Other" when the uni's course page doesn't say.</summary>
    public required string College { get; set; }
    public List<string> Campuses { get; set; } = [];
    public bool IsDoubleDegree { get; set; }
    public required string Url { get; set; }
}


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
    public int? DegreeId { get; set; }
    public Degree? Degree { get; set; }

    /// <summary>Free text, e.g. "she/her". Optional.</summary>
    public string? Pronouns { get; set; }
    /// <summary>Deprecated (PM, 2026-09-26): no longer written or returned. Column to be dropped.</summary>
    public AgeRange? AgeRange { get; set; }
    /// <summary>Deprecated (PM, 2026-09-26): no longer written or returned. Column to be dropped.</summary>
    public string? Nationality { get; set; }
    public int? YearOfStudy { get; set; }
    public string? Bio { get; set; }

    /// <summary>Lower-cased tags, e.g. "early-bird", "gym", "non-smoker". Stored as Postgres text[].</summary>
    public List<string> Habits { get; set; } = [];
    public List<string> Interests { get; set; } = [];

    /// <summary>Object key in R2 (not a full URL).</summary>
    public string? AvatarKey { get; set; }
    /// <summary>
    /// The design's preset avatar: a colour (0–7) behind the nickname's initial. Null = none ("?").
    /// An uploaded photo (AvatarKey) is shown instead when there is one.
    /// </summary>
    public int? AvatarPreset { get; set; }

    // The rest of the design's avatar builder, drawn with AvatarPreset's colour
    public AvatarMode AvatarMode { get; set; }
    /// <summary>One or two capital letters for the Initials mode. Null: the nickname's first letter.</summary>
    public string? AvatarText { get; set; }
    public AvatarIcon AvatarIcon { get; set; }
    public AvatarShape AvatarShape { get; set; }
    public AvatarRing AvatarRing { get; set; }

    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;
}
