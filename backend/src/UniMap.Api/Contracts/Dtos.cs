using System.ComponentModel.DataAnnotations;
using UniMap.Api.Domain;

namespace UniMap.Api.Contracts;

public record RegisterRequest(
    [Required, EmailAddress] string Email,
    [Required, MinLength(8)] string Password);

/// <param name="DevCode">Only populated in Development so the frontend can skip real email.</param>
public record RegisterResponse(Guid UserId, University University, string Message, string? DevCode);

public record VerifyEmailRequest([Required, EmailAddress] string Email, [Required] string Code);

public record ResendCodeRequest([Required, EmailAddress] string Email);

public record LoginRequest([Required, EmailAddress] string Email, [Required] string Password);

public record AuthResponse(string AccessToken, DateTimeOffset ExpiresAt, bool OnboardingComplete);

public record UpsertProfileRequest(
    [Required, MaxLength(64)] string DisplayName,
    [Required, MaxLength(128)] string Department,
    [Required] Gender Gender,
    [MaxLength(32)] string? Pronouns,
    AgeRange? AgeRange,
    [RegularExpression("^[A-Za-z]{2}$", ErrorMessage = "Use a 2-letter ISO country code, e.g. AU.")] string? Nationality,
    [Range(1, 10)] int? YearOfStudy,
    [MaxLength(500)] string? Bio,
    [MaxLength(20)] List<string> Habits,
    [MaxLength(20)] List<string> Interests,
    string? AvatarKey);

public record ProfileDto(
    Guid UserId,
    string DisplayName,
    University University,
    string Department,
    Gender Gender,
    string? Pronouns,
    AgeRange? AgeRange,
    string? Nationality,
    int? YearOfStudy,
    string? Bio,
    List<string> Habits,
    List<string> Interests,
    string? AvatarUrl);

public record MeResponse(Guid UserId, string Email, University University, ProfileDto? Profile);

public record BuddySuggestion(ProfileDto Profile, double Score, List<string> SharedHabits, List<string> SharedInterests);

public record ConnectionDto(Guid Id, ProfileDto Other, ConnectionStatus Status, bool IncomingRequest, DateTimeOffset CreatedAt);

public record UploadUrlRequest([Required] string ContentType);

public record UploadUrlResponse(string UploadUrl, string Key, string? ReadUrl, DateTimeOffset ExpiresAt);

public record OptionsResponse(
    IEnumerable<string> Universities,
    IEnumerable<string> Genders,
    IEnumerable<string> Pronouns,
    IEnumerable<AgeRange> AgeRanges,
    IEnumerable<Country> Countries,
    IEnumerable<string> Habits,
    IEnumerable<string> Interests);
