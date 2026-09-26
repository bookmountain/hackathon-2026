using UniMap.Api.Contracts;
using UniMap.Api.Domain;

namespace UniMap.Api.Services;

public static class ItemMapper
{
    public static ItemSummary ToSummary(MarketItem i, Guid viewerId, StorageService storage)
    {
        var mine = i.SellerId == viewerId;
        var (availability, from) = Current(i);
        return new ItemSummary(
            i.Id, i.Title, i.Price, i.Category, i.Condition, i.ConditionNote,
            MarketCatalog.ConditionLabel(i.Condition, i.ConditionNote),
            availability, from, Pickup(i, mine),
            storage.ReadUrl(i.PhotoKeys.FirstOrDefault()),
            mine, i.CreatedAt);
    }

    /// <summary>Needs Seller, Seller.Profile and Seller.Profile.Degree loaded.</summary>
    public static ItemDetail ToDetail(MarketItem i, Guid viewerId, StorageService storage)
    {
        var p = i.Seller.Profile;
        var seller = new ItemSeller(
            i.SellerId, p?.DisplayName ?? "Student", i.Seller.University,
            p?.Degree?.Name ?? p?.Department, storage.ReadUrl(p?.AvatarKey));
        return new ItemDetail(
            ToSummary(i, viewerId, storage), i.Description,
            i.PhotoKeys.Select(k => storage.ReadUrl(k)!).ToList(),
            i.SellerId == viewerId ? i.PhotoKeys : [],
            seller);
    }

    /// <summary>"From 1 Oct" becomes "Now" once the date arrives.</summary>
    private static (ItemAvailability, DateOnly?) Current(MarketItem i) =>
        i.Availability == ItemAvailability.From && i.AvailableFrom is { } d && d <= DateOnly.FromDateTime(DateTime.UtcNow)
            ? (ItemAvailability.Now, null)
            : (i.Availability, i.AvailableFrom);

    private static ItemPickup Pickup(MarketItem i, bool mine)
    {
        if (i.PickupPointId is { } id && PickupPoints.Find(id) is { } p)
            return new ItemPickup(p.Id, p.Name, p.Note, p.Lat, p.Lng);
        double lat = i.Location.Y, lng = i.Location.X;
        return new ItemPickup(null, i.PlaceName, null,
            mine ? lat : LocationPrivacy.Blur(lat), mine ? lng : LocationPrivacy.Blur(lng));
    }
}
