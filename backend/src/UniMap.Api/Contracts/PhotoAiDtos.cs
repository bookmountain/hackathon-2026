using System.ComponentModel.DataAnnotations;
using UniMap.Api.Domain;

namespace UniMap.Api.Contracts;

/// <summary>Which form the photo is for.</summary>
public enum PhotoAnalysisKind { Item, Room }

/// <summary>A photo for Claude to look at.</summary>
/// <param name="Kind">Item (the Sell form) or Room ("List a room").</param>
/// <param name="Image">Base64 JPEG, PNG, GIF or WebP (a data: URL works too), up to 3.75 MB. The app sends a
/// JPEG with its longest side at 640 px.</param>
public record PhotoAnalysisRequest([Required] PhotoAnalysisKind? Kind, [Required] string Image);

/// <summary>A photo to search the market with.</summary>
/// <param name="Image">Base64 JPEG, PNG, GIF or WebP, as for photo analysis.</param>
public record ImageSearchRequest([Required] string Image);

/// <summary>What Claude sees in an item photo, to pre-fill the Sell form (the prototype's "AI" card).</summary>
/// <param name="Title">At most 6 words.</param>
/// <param name="Colour">Main colour(s), e.g. "Matte black".</param>
/// <param name="Texture">Material and texture, e.g. "Brushed aluminium".</param>
/// <param name="SuggestedPrice">Typical student resale price, whole AUD ("Use suggested price").</param>
/// <param name="Description">2 friendly sentences.</param>
/// <param name="Benefits">3 short benefits for a student.</param>
public record ItemPhotoAnalysis(
    string Title,
    ItemCategory Category,
    ItemCondition Condition,
    string Colour,
    string Texture,
    int SuggestedPrice,
    string Description,
    List<string> Benefits);

/// <summary>What Claude sees in a room photo, to pre-fill the "List a room" form.</summary>
/// <param name="Title">At most 7 words.</param>
/// <param name="Style">Interior style, e.g. "Scandi minimal".</param>
/// <param name="Colours">Main colour palette.</param>
/// <param name="Features">Visible or very likely features, from GET /api/flats/options.</param>
/// <param name="Description">2 friendly sentences.</param>
/// <param name="Benefits">3 short reasons a student would like the room.</param>
public record RoomPhotoAnalysis(
    string Title,
    string Style,
    string Colours,
    Furnishing Furnished,
    List<string> Features,
    string Description,
    List<string> Benefits);

/// <summary>Claude's reading of a search photo. Category is an ItemCategory name, or "Other".</summary>
public record PhotoSearchTerms(string Label, string Category, List<string> Keywords);

/// <summary>Market items that look like the photo.</summary>
/// <param name="Category">The category it belongs to, or null if none fits.</param>
/// <param name="Items">Closest matches first. Sold items are left out.</param>
/// <param name="Label">What the photo shows, e.g. "Desk lamp": "Looks like: …".</param>
/// <param name="Keywords">The words the items were matched on.</param>
public record ImageSearchResponse(ItemCategory? Category, List<ItemSummary> Items, string Label, List<string> Keywords);
