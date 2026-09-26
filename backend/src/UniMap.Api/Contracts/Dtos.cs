using System.ComponentModel.DataAnnotations;
using UniMap.Api.Domain;

namespace UniMap.Api.Contracts;

public record RegisterRequest(
    [Required, EmailAddress] string Email,
    [Required, MinLength(8)] string Password);

/// <param name="DevCode">Only populated in Development (or when Auth:ReturnDevCode=true) so the frontend can skip real email.</param>
public record RegisterResponse(Guid UserId, University University, string Message, string? DevCode);

public record VerifyEmailRequest([Required, EmailAddress] string Email, [Required] string Code);

public record ResendCodeRequest([Required, EmailAddress] string Email);

public record LoginRequest([Required, EmailAddress] string Email, [Required] string Password);

/// <param name="ConsentComplete">False: show the consent screen next (most endpoints return 403 until then).</param>
/// <param name="OnboardingComplete">False: show the profile screen next.</param>
public record AuthResponse(string AccessToken, DateTimeOffset ExpiresAt, bool ConsentComplete, bool OnboardingComplete);

/// <param name="DegreeId">From GET /api/degrees. When set, Department is filled in from the degree's college.</param>
/// <param name="Department">Only used when DegreeId is not set.</param>
/// <param name="AgeRange">Deprecated: removed at the PM's request. Ignored by the server.</param>
/// <param name="Nationality">Deprecated: removed at the PM's request. Ignored by the server.</param>
/// <param name="AvatarKey">From POST /api/uploads/avatar. This replaces the saved photo: send back the
/// profile's current avatarKey to keep it, or null to remove it.</param>
/// <param name="AvatarPreset">The design's preset avatar colour, 0–7; null for none ("?").</param>
public record UpsertProfileRequest(
    [Required, MaxLength(64)] string DisplayName,
    int? DegreeId,
    [MaxLength(128)] string? Department,
    [Required] Gender Gender,
    [MaxLength(32)] string? Pronouns,
    [property: Obsolete("Removed at the PM's request; ignored.")] AgeRange? AgeRange,
    [property: Obsolete("Removed at the PM's request; ignored.")] string? Nationality,
    [Range(1, 10)] int? YearOfStudy,
    [MaxLength(500)] string? Bio,
    [MaxLength(20)] List<string> Habits,
    [MaxLength(20)] List<string> Interests,
    string? AvatarKey,
    [Range(0, Catalog.MaxAvatarPreset)] int? AvatarPreset = null);

/// <param name="AvatarUrl">Photo avatar, valid for 24 hours.</param>
/// <param name="AvatarKey">The photo's R2 key. Send it back on PUT /api/me/profile to keep the photo.</param>
/// <param name="AvatarPreset">Preset avatar colour, 0–7, or null. Shown when there's no photo.</param>
public record ProfileDto(
    Guid UserId,
    string DisplayName,
    University University,
    DegreeSummary? Degree,
    string Department,
    Gender Gender,
    string? Pronouns,
    int? YearOfStudy,
    string? Bio,
    List<string> Habits,
    List<string> Interests,
    string? AvatarUrl,
    string? AvatarKey,
    int? AvatarPreset);

public record MeResponse(Guid UserId, string Email, University University, bool ConsentComplete, ProfileDto? Profile);

public record UploadUrlRequest([Required] string ContentType);

public record UploadUrlResponse(string UploadUrl, string Key, string? ReadUrl, DateTimeOffset ExpiresAt);

public record OptionsResponse(
    IEnumerable<string> Universities,
    IEnumerable<string> Genders,
    IEnumerable<string> Pronouns,
    IEnumerable<string> Habits,
    IEnumerable<string> Interests);

public record DegreeSummary(int Id, string Name, DegreeLevel Level, string College);

public record DegreeDto(
    int Id,
    University University,
    DegreeLevel Level,
    string AwardType,
    string Name,
    string College,
    List<string> Campuses,
    bool IsDoubleDegree,
    string Url);

/// <summary>One dropdown option plus how many degrees sit under it.</summary>
public record DegreeOption<T>(T Value, int Count);
