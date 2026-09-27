using UniMap.Api.Contracts;
using UniMap.Api.Domain;

namespace UniMap.Api.Services;

public static class ProfileMapper
{
    /// <summary>Needs <see cref="Profile.User"/> loaded, and <see cref="Profile.Degree"/> if the profile has one.</summary>
    public static ProfileDto ToDto(Profile p, StorageService storage) => new(
        p.UserId, p.DisplayName, p.User.University,
        p.Degree is null ? null : new DegreeSummary(p.Degree.Id, p.Degree.Name, p.Degree.Level, p.Degree.College),
        p.Department, p.Gender, p.Pronouns, p.YearOfStudy, p.Bio,
        p.Habits, p.Interests, storage.ReadUrl(p.AvatarKey), p.AvatarKey, p.AvatarPreset, Style(p));

    public static AvatarStyle Style(Profile p) =>
        new(p.AvatarMode, p.AvatarText ?? "", p.AvatarIcon, p.AvatarShape, p.AvatarRing);

    /// <summary>For other people's cards: null when they have no profile.</summary>
    public static AvatarStyle? StyleOrNull(Profile? p) => p is null ? null : Style(p);
}
