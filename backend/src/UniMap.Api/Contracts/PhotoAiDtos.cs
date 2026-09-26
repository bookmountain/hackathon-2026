using System.ComponentModel.DataAnnotations;
using UniMap.Api.Domain;

namespace UniMap.Api.Contracts;

/// <summary>A photo to analyse: JPEG, PNG, GIF or WebP, up to 3.75 MB (resize to about 1500 px first).</summary>
public class PhotoUploadForm
{
    [Required] public IFormFile Photo { get; set; } = null!;
}

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
/// <param name="Label">What the photo shows, e.g. "Desk lamp": "Looks like: …".</param>
/// <param name="Category">The category it belongs to, or null if none fits.</param>
/// <param name="Keywords">The words the items were matched on.</param>
/// <param name="Items">Closest matches first. Sold items are left out.</param>
public record PhotoSearchResponse(string Label, ItemCategory? Category, List<string> Keywords, List<ItemSummary> Items);
