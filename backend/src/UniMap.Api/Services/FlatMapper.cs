using UniMap.Api.Contracts;
using UniMap.Api.Domain;

namespace UniMap.Api.Services;

public static class FlatMapper
{
    private static readonly Campus AdelaideCity = Campuses.Find("adelaide-city")!;
    private static readonly Campus FlindersCity = Campuses.Find("flinders-city")!;

    public static FlatSummary ToSummary(FlatListing f, Guid viewerId, StorageService storage)
    {
        var mine = f.OwnerId == viewerId;
        double lat = f.Location.Y, lng = f.Location.X;
        return new FlatSummary(
            f.Id, f.Title, f.Suburb, f.Street,
            mine ? lat : LocationPrivacy.Blur(lat), mine ? lng : LocationPrivacy.Blur(lng),
            f.RentPerWeek, f.BillsPerWeek, f.RentPerWeek + f.BillsPerWeek,
            f.Bedrooms, f.Flatmates, f.Toilet, f.Bathroom, f.Furnished, f.AvailableFrom,
            storage.ReadUrl(f.PhotoKeys.FirstOrDefault()),
            Campuses.WalkMinutes(lat, lng, AdelaideCity),
            Campuses.WalkMinutes(lat, lng, FlindersCity),
            Walks(lat, lng).Take(2).ToList(),
            f.Status, mine, f.CreatedAt);
    }

    /// <summary>Needs Owner, Owner.Profile and Owner.Profile.Degree loaded.</summary>
    public static FlatDetail ToDetail(FlatListing f, Guid viewerId, StorageService storage)
    {
        var p = f.Owner.Profile;
        var owner = new FlatOwner(
            f.OwnerId, p?.DisplayName ?? "Student", f.Owner.University,
            p?.Degree?.Name ?? p?.Department, storage.ReadUrl(p?.AvatarKey), p?.AvatarPreset,
            ProfileMapper.StyleOrNull(p));
        return new FlatDetail(
            ToSummary(f, viewerId, storage), f.Description, f.MinStayMonths, f.Features, f.HouseRhythm,
            f.PreferredFlatmate, f.Housemates,
            f.PhotoKeys.Select(k => storage.ReadUrl(k)!).ToList(),
            f.OwnerId == viewerId ? f.PhotoKeys : [],
            Walks(f.Location.Y, f.Location.X).ToList(),
            owner);
    }

    /// <summary>All campuses, nearest first.</summary>
    private static IEnumerable<CampusWalk> Walks(double lat, double lng) =>
        Campuses.All
            .Select(c => new CampusWalk(c.Id, c.Name, c.University, Campuses.WalkMinutes(lat, lng, c)))
            .OrderBy(w => w.WalkMinutes);
}
