using System.ComponentModel.DataAnnotations;
using UniMap.Api.Domain;

namespace UniMap.Api.Contracts;

/// <summary>Where to pick the item up.</summary>
/// <param name="PickupPointId">One of the safe pickup points, or null for the seller's own pin.</param>
/// <param name="Name">The pickup point's name, or the name the seller gave their pin (may be null).</param>
/// <param name="Note">Pickup points only, e.g. "North Tce concourse · staffed, CCTV".</param>
/// <param name="Lat">Exact for pickup points. A seller's own pin is rounded to ~100 m for everyone but the seller.</param>
public record ItemPickup(string? PickupPointId, string? Name, string? Note, double Lat, double Lng);

/// <summary>Map pin / grid card.</summary>
/// <param name="Price">Whole dollars. 0 = free.</param>
/// <param name="ConditionLabel">Ready to show, e.g. "Good — some highlighting".</param>
/// <param name="Availability">Now, From (see availableFrom), Pending or Sold. A From date that has passed comes back as Now.</param>
/// <param name="IsMine">Show "Your listing" instead of "Message seller".</param>
/// <param name="CreatedAt">The "posted 2h ago" time.</param>
public record ItemSummary(
    Guid Id,
    string Title,
    int Price,
    ItemCategory Category,
    ItemCondition Condition,
    string? ConditionNote,
    string ConditionLabel,
    ItemAvailability Availability,
    DateOnly? AvailableFrom,
    ItemPickup Pickup,
    string? CoverPhotoUrl,
    bool IsMine,
    DateTimeOffset CreatedAt);

/// <param name="AvatarPreset">Preset avatar colour, 0–7, or null. Shown when there's no photo.</param>
public record ItemSeller(Guid UserId, string DisplayName, University University, string? Major, string? AvatarUrl, int? AvatarPreset);

/// <summary>Item detail page.</summary>
/// <param name="PhotoKeys">Only for the seller, to send back unchanged on PUT.</param>
public record ItemDetail(
    ItemSummary Summary,
    string? Description,
    List<string> PhotoUrls,
    List<string> PhotoKeys,
    ItemSeller Seller);

/// <param name="Id">Create only: the itemId returned by POST /api/uploads/item-photo, so the item and its
/// photos share the R2 folder items/{id}/.</param>
/// <param name="Price">Whole dollars, 0 to 10000. 0 = free.</param>
/// <param name="Category">From GET /api/items/options.</param>
/// <param name="Condition">From GET /api/items/options.</param>
/// <param name="ConditionNote">Optional detail shown after the condition, e.g. "some highlighting".</param>
/// <param name="Availability">Now, From (send availableFrom) or Pending. Sold is only allowed when editing.</param>
/// <param name="AvailableFrom">Required when availability is From; ignored otherwise.</param>
/// <param name="PickupPointId">A safe pickup point from GET /api/items/options. Or leave null and send lat/lng
/// for your own pin.</param>
/// <param name="PlaceName">Optional name for your own pin, e.g. "Rundle St East". Ignored with a pickup point.</param>
/// <param name="Lat">Your own pin, in greater Adelaide. Only when pickupPointId is null.</param>
/// <param name="PhotoKeys">1 to 5 keys from POST /api/uploads/item-photo, already uploaded. The first is the cover.</param>
public record UpsertItemRequest(
    Guid? Id,
    [Required, MaxLength(80)] string Title,
    [Required, Range(0, 10000)] int? Price,
    [MaxLength(1000)] string? Description,
    [Required] ItemCategory? Category,
    [Required] ItemCondition? Condition,
    [MaxLength(60)] string? ConditionNote,
    [Required] ItemAvailability? Availability,
    DateOnly? AvailableFrom,
    string? PickupPointId,
    [MaxLength(64)] string? PlaceName,
    [Range(-35.4, -34.5)] double? Lat,
    [Range(138.3, 139.0)] double? Lng,
    [MaxLength(MarketCatalog.MaxPhotos)] List<string>? PhotoKeys);

/// <param name="Availability">Now, From, Pending or Sold.</param>
/// <param name="AvailableFrom">Required when availability is From.</param>
public record ItemAvailabilityRequest([Required] ItemAvailability? Availability, DateOnly? AvailableFrom);

/// <param name="ItemId">The item these photos belong to. Null on the first photo of a new item: the
/// server issues an id; send it with the next photos and as "id" on POST /api/items.</param>
public record ItemPhotoUploadRequest([Required] string ContentType, Guid? ItemId);

/// <param name="ItemId">Photos are stored under items/{itemId}/.</param>
public record ItemPhotoUploadResponse(Guid ItemId, string UploadUrl, string Key, string? ReadUrl, DateTimeOffset ExpiresAt);

/// <summary>A value and the text to show for it.</summary>
public record LabeledOption<T>(T Value, string Label);

/// <param name="ItemCount">Items for sale there (not sold), matching the category filter.</param>
public record PickupPointSummary(
    string Id, string Name, string ShortName, string Note, double Lat, double Lng, int ItemCount);

public record ItemOptionsResponse(
    IEnumerable<LabeledOption<ItemCategory>> Categories,
    IEnumerable<LabeledOption<ItemCondition>> Conditions,
    IEnumerable<PickupPoint> PickupPoints,
    int MaxPhotos);
