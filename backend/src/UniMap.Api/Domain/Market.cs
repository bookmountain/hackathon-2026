using NetTopologySuite.Geometries;

namespace UniMap.Api.Domain;

/// <summary>The filter chips on the Market tab.</summary>
public enum ItemCategory { Textbooks, Tech, Furniture, Kitchen, StudyGear }

public enum ItemCondition { New, LikeNew, Excellent, Good, Fair }

/// <summary>
/// The "Availability" control on the Sell form (Now, From date, Pending), plus Sold. Sold items stay
/// visible, greyed out with a disabled "Sold" button, but can't be messaged about.
/// </summary>
public enum ItemAvailability { Now, From, Pending, Sold }

/// <summary>Something a student sells (the "Market" tab).</summary>
public class MarketItem
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid SellerId { get; set; }
    public User Seller { get; set; } = null!;

    public required string Title { get; set; }
    public string? Description { get; set; }
    /// <summary>Whole dollars. 0 = free.</summary>
    public int Price { get; set; }
    public ItemCategory Category { get; set; }
    public ItemCondition Condition { get; set; }
    /// <summary>Optional detail shown after the condition, e.g. "some highlighting".</summary>
    public string? ConditionNote { get; set; }
    public ItemAvailability Availability { get; set; }
    /// <summary>Only set when Availability is From.</summary>
    public DateOnly? AvailableFrom { get; set; }

    /// <summary>One of <see cref="PickupPoints"/>, or null when the seller dropped their own pin.</summary>
    public string? PickupPointId { get; set; }
    /// <summary>Name of the seller's own pin, e.g. "Rundle St East". Null for pickup points.</summary>
    public string? PlaceName { get; set; }
    /// <summary>
    /// The pickup point's location, or the seller's pin. WGS84 (SRID 4326), stored as PostGIS geography.
    /// </summary>
    public required Point Location { get; set; }

    /// <summary>R2 object keys, first one is the cover photo. At least one.</summary>
    public List<string> PhotoKeys { get; set; } = [];

    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;
}

/// <param name="ShortName">For map pins, e.g. "Barr Smith".</param>
/// <param name="Note">Shown under the name, e.g. "North Tce concourse · staffed, CCTV".</param>
public record PickupPoint(string Id, string Name, string ShortName, string Note, double Lat, double Lng);

/// <summary>
/// The prototype's suggested safe pickup points (also the preset meetup places). Coordinates from
/// OpenStreetMap (Nominatim, 2026-09-26).
/// </summary>
public static class PickupPoints
{
    public static readonly PickupPoint[] All =
    [
        new("adelaide-railway-station", "Adelaide Railway Station", "Railway Stn",
            "North Tce concourse · staffed, CCTV", -34.92142, 138.59758),
        new("flinders-city-campus", "Flinders City Campus", "Flinders City",
            "Festival Plaza entrance", -34.92053, 138.59804),
        new("barr-smith-library", "Barr Smith Library", "Barr Smith",
            "Main entrance, Adelaide Uni", -34.91888, 138.60448),
    ];

    public static PickupPoint? Find(string id) => All.FirstOrDefault(p => p.Id == id);
}

public static class MarketCatalog
{
    public const int MaxPhotos = 5;

    public static string Label(ItemCategory c) => c switch
    {
        ItemCategory.StudyGear => "Study gear",
        _ => c.ToString(),
    };

    public static string Label(ItemCondition c) => c switch
    {
        ItemCondition.LikeNew => "Like new",
        _ => c.ToString(),
    };

    /// <summary>What the item card shows, e.g. "Good — some highlighting".</summary>
    public static string ConditionLabel(ItemCondition c, string? note) =>
        note is null ? Label(c) : $"{Label(c)} — {note}";
}
