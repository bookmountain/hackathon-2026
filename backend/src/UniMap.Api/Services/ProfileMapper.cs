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
        p.Habits, p.Interests, storage.ReadUrl(p.AvatarKey));
}
