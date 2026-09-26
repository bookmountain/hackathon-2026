using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using UniMap.Api.Contracts;
using UniMap.Api.Data;
using UniMap.Api.Domain;
using UniMap.Api.Services;

namespace UniMap.Api.Controllers;

/// <summary>
/// Photo analysis with Claude: pre-fill the Sell and "List a room" forms from a photo, and search the
/// market by photo. Send the photo as multipart/form-data field "photo". It's only sent to Claude, never
/// stored; upload listing photos to R2 as usual. 503 when the server has no Anthropic API key.
/// </summary>
[ApiController]
[Authorize]
[RequestSizeLimit(4 * 1024 * 1024)]
public class PhotoAiController(PhotoAiService ai, AppDbContext db, StorageService storage) : ControllerBase
{
    /// <summary>
    /// The Sell form's photo: title, category, condition, colour, texture, suggested price, description and
    /// benefits. The prototype writes the description as the description, then "Colour: … · Texture: … ·
    /// Condition: …" and the benefits as "• " lines.
    /// </summary>
    [HttpPost("api/items/analyse-photo")]
    public Task<ActionResult<ItemPhotoAnalysis>> AnalyseItem([FromForm] PhotoUploadForm form, CancellationToken ct) =>
        Run(form, photo => ai.AnalyseItemAsync(photo, ct), ct);

    /// <summary>
    /// The "List a room" form's photo: title, style, colours, furnished, features, description and benefits.
    /// The prototype adds the features to the ones already picked, and the benefits to the description as
    /// "• " lines.
    /// </summary>
    [HttpPost("api/flats/analyse-photo")]
    public Task<ActionResult<RoomPhotoAnalysis>> AnalyseRoom([FromForm] PhotoUploadForm form, CancellationToken ct) =>
        Run(form, photo => ai.AnalyseRoomAsync(photo, ct), ct);

    /// <summary>
    /// Search the market with a photo (the camera button in the search box): what it looks like, and the
    /// closest unsold items, those in the same category whose title or description has the most keywords first.
    /// </summary>
    /// <param name="limit">How many items to return (the prototype shows up to 5).</param>
    [HttpPost("api/items/search-by-photo")]
    public Task<ActionResult<PhotoSearchResponse>> SearchByPhoto(
        [FromForm] PhotoUploadForm form, CancellationToken ct, [FromQuery] int limit = 5) =>
        Run(form, async photo =>
        {
            var terms = await ai.SearchTermsAsync(photo, ct);
            ItemCategory? category = Enum.TryParse<ItemCategory>(terms.Category, out var c) ? c : null;
            var keywords = terms.Keywords
                .Select(k => k.Trim().ToLowerInvariant())
                .Where(k => k.Length >= 2)
                .Distinct().Take(4).ToList();

            var q = db.MarketItems.AsNoTracking().Where(i => i.Availability != ItemAvailability.Sold);
            if (category is not null) q = q.Where(i => i.Category == category);
            var candidates = await q.OrderByDescending(i => i.CreatedAt).Take(200).ToListAsync(ct);

            int Hits(MarketItem i) => keywords.Count(k =>
                i.Title.Contains(k, StringComparison.OrdinalIgnoreCase)
                || (i.Description?.Contains(k, StringComparison.OrdinalIgnoreCase) ?? false));
            var me = User.UserId();
            var items = candidates
                .Select(i => (Item: i, Hits: Hits(i)))
                .Where(x => category is not null || x.Hits > 0)
                .OrderByDescending(x => x.Hits) // stable: newest first among equals
                .Take(Math.Clamp(limit, 1, 50))
                .Select(x => ItemMapper.ToSummary(x.Item, me, storage))
                .ToList();
            return new PhotoSearchResponse(terms.Label, category, keywords, items);
        }, ct);

    private async Task<ActionResult<T>> Run<T>(PhotoUploadForm form, Func<Photo, Task<T>> analyse, CancellationToken ct)
    {
        if (!ai.IsConfigured)
            return Problem("Photo analysis isn't set up on this server (Anthropic:ApiKey).",
                statusCode: StatusCodes.Status503ServiceUnavailable);
        if (await Photo.ReadAsync(form.Photo, ct) is not { } photo)
            return Problem("Send a JPEG, PNG, GIF or WebP photo of up to 3.75 MB.", statusCode: StatusCodes.Status400BadRequest);
        try
        {
            return await analyse(photo);
        }
        catch (PhotoAiException e)
        {
            return Problem(e.Message, statusCode: e.StatusCode);
        }
    }
}
