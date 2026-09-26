using System.ComponentModel.DataAnnotations;
using UniMap.Api.Domain;

namespace UniMap.Api.Contracts;

public record CampusWalk(string CampusId, string Name, University University, int WalkMinutes);

/// <summary>Map pin / list card.</summary>
/// <param name="Lat">Rounded to ~100 m for everyone except the owner.</param>
/// <param name="WalkToAdelaideUni">Minutes to Adelaide Uni, North Tce (shown on every card in the design).</param>
/// <param name="WalkToFlindersCity">Minutes to Flinders City Campus (shown on every card in the design).</param>
/// <param name="NearestCampuses">The two closest campuses. For suburban rooms (e.g. Bedford Park) the city
/// walks are 2+ hours, so show these instead when a city walk is over ~45 minutes.</param>
public record FlatSummary(
    Guid Id,
    string Title,
    string Suburb,
    string? Street,
    double Lat,
    double Lng,
    int RentPerWeek,
    int BillsPerWeek,
    int TotalPerWeek,
    int Bedrooms,
    int Flatmates,
    ToiletType Toilet,
    BathroomType Bathroom,
    Furnishing Furnished,
    DateOnly? AvailableFrom,
    string? CoverPhotoUrl,
    int WalkToAdelaideUni,
    int WalkToFlindersCity,
    List<CampusWalk> NearestCampuses,
    ListingStatus Status,
    bool IsMine,
    DateTimeOffset CreatedAt);

public record FlatOwner(Guid UserId, string DisplayName, University University, string? Major, string? AvatarUrl);

/// <summary>Room detail page.</summary>
public record FlatDetail(
    FlatSummary Summary,
    string? Description,
    int? MinStayMonths,
    List<string> Features,
    List<string> HouseRhythm,
    string? PreferredFlatmate,
    List<string> Housemates,
    List<string> PhotoUrls,
    List<string> PhotoKeys,
    List<CampusWalk> Campuses,
    FlatOwner Owner);

/// <param name="Id">Create only: the listingId returned by POST /api/uploads/flat-photo, so the listing
/// and its photos share the R2 folder flats/{id}/. Leave null if you have no photos yet.</param>
/// <param name="Lat">Where the owner pinned the flat. Must be in greater Adelaide.</param>
/// <param name="MinStayMonths">Null = flexible.</param>
/// <param name="AvailableFrom">Null = available now.</param>
/// <param name="Features">From GET /api/flats/options.</param>
/// <param name="HouseRhythm">From GET /api/flats/options.</param>
/// <param name="Housemates">"Who lives here", including you, e.g. "Flinders · Law". No names.</param>
/// <param name="PhotoKeys">Up to 5 keys from POST /api/uploads/flat-photo. The first is the cover.</param>
public record UpsertFlatRequest(
    Guid? Id,
    [Required, MaxLength(80)] string Title,
    [MaxLength(1000)] string? Description,
    [Required, MaxLength(64)] string Suburb,
    [MaxLength(64)] string? Street,
    [Range(-35.4, -34.5)] double Lat,
    [Range(138.3, 139.0)] double Lng,
    [Range(50, 2000)] int RentPerWeek,
    [Range(0, 500)] int BillsPerWeek,
    [Range(1, 8)] int Bedrooms,
    [Range(0, 8)] int Flatmates,
    [Required] ToiletType Toilet,
    [Required] BathroomType Bathroom,
    [Required] Furnishing Furnished,
    [Range(1, 24)] int? MinStayMonths,
    DateOnly? AvailableFrom,
    List<string>? Features,
    List<string>? HouseRhythm,
    [MaxLength(200)] string? PreferredFlatmate,
    [MaxLength(8)] List<string>? Housemates,
    [MaxLength(FlatCatalog.MaxPhotos)] List<string>? PhotoKeys);

/// <param name="ListingId">The listing these photos belong to. Null on the first photo of a new
/// listing: the server issues an id; send it with the next photos and as "id" on POST /api/flats.</param>
public record FlatPhotoUploadRequest([Required] string ContentType, Guid? ListingId);

/// <param name="ListingId">Photos are stored under flats/{listingId}/.</param>
public record FlatPhotoUploadResponse(Guid ListingId, string UploadUrl, string Key, string? ReadUrl, DateTimeOffset ExpiresAt);

public record FlatStatusRequest([Required] ListingStatus Status);

public record FlatOptionsResponse(
    IEnumerable<string> Features,
    IEnumerable<string> HouseRhythm,
    IEnumerable<Campus> Campuses,
    int MaxPhotos);
