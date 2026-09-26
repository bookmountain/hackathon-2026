using NetTopologySuite.Geometries;

namespace UniMap.Api.Domain;

public enum ToiletType { PrivateEnsuite, Shared }
public enum BathroomType { Ensuite, Shared }
public enum Furnishing { Fully, Partly, Unfurnished }
/// <summary>Taken listings stay visible to their owner but drop out of search.</summary>
public enum ListingStatus { Active, Taken }

/// <summary>A room offered by a student in their share house (the "Flats" tab).</summary>
public class FlatListing
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid OwnerId { get; set; }
    public User Owner { get; set; } = null!;

    public required string Title { get; set; }
    public string? Description { get; set; }
    public required string Suburb { get; set; }
    public string? Street { get; set; }
    /// <summary>The pin the owner dropped. WGS84 (SRID 4326), stored as PostGIS geography.</summary>
    public required Point Location { get; set; }

    public int RentPerWeek { get; set; }
    public int BillsPerWeek { get; set; }
    public int Bedrooms { get; set; }
    /// <summary>People already living there, not counting the new flatmate.</summary>
    public int Flatmates { get; set; }
    public ToiletType Toilet { get; set; }
    public BathroomType Bathroom { get; set; }
    public Furnishing Furnished { get; set; }
    /// <summary>Null = flexible.</summary>
    public int? MinStayMonths { get; set; }
    /// <summary>Null = available now.</summary>
    public DateOnly? AvailableFrom { get; set; }

    public List<string> Features { get; set; } = [];
    public List<string> HouseRhythm { get; set; } = [];
    public string? PreferredFlatmate { get; set; }
    /// <summary>"Who lives here", e.g. "Flinders · Law". No names.</summary>
    public List<string> Housemates { get; set; } = [];
    /// <summary>R2 object keys, first one is the cover photo.</summary>
    public List<string> PhotoKeys { get; set; } = [];

    public ListingStatus Status { get; set; } = ListingStatus.Active;
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;
}

/// <summary>Chip options from the UCompass "List a room" form.</summary>
public static class FlatCatalog
{
    public static readonly string[] Features =
        ["Air con", "Double bed", "Kitchenette", "Desk", "Wi-Fi included", "Laundry", "Parking", "Balcony"];

    public static readonly string[] HouseRhythm =
        ["Quiet weeknights", "Social house", "Early birds", "Shared dinners", "Plant parents", "Gym crew"];

    public const int MaxPhotos = 5;
}
