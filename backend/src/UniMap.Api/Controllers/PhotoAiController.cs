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
/// market by photo. The photo is base64 in the JSON body. It's only sent to Claude, never stored; upload
/// listing photos to R2 as usual. 503 with code "ai_not_configured" when the server has no Anthropic API key.
/// </summary>
[ApiController]
[Authorize]
[RequestSizeLimit(6 * 1024 * 1024)]
public class PhotoAiController(PhotoAiService ai, AppDbContext db, StorageService storage) : ControllerBase
{
    /// <summary>
    /// The "AI photo analysis" card. For kind Item (Sell): title, category, condition, colour, texture,
    /// suggested price, description and benefits. For kind Room ("List a room"): title, style, colours,
    /// furnished, features, description and benefits.
    /// </summary>
    [HttpPost("api/ai/photo-analysis")]
    [ProducesResponseType<ItemPhotoAnalysis>(StatusCodes.Status200OK)]
    [ProducesResponseType<RoomPhotoAnalysis>(StatusCodes.Status200OK)]
    public Task<IActionResult> Analyse(PhotoAnalysisRequest req, CancellationToken ct) =>
        Run(req.Image, async photo => req.Kind == PhotoAnalysisKind.Room
            ? Ok(await ai.AnalyseRoomAsync(photo, ct))
            : Ok(await ai.AnalyseItemAsync(photo, ct)));

    /// <summary>
    /// Search the market with a photo (the camera button in the search box): the category it belongs to and
    /// the closest unsold items, those in that category whose title or description has the most keywords
    /// first. Also what it looks like ("Looks like: …").
    /// </summary>
    /// <param name="limit">How many items to return (the prototype shows up to 5).</param>
    [HttpPost("api/items/image-search")]
    [ProducesResponseType<ImageSearchResponse>(StatusCodes.Status200OK)]
    public Task<IActionResult> ImageSearch(ImageSearchRequest req, CancellationToken ct, [FromQuery] int limit = 5) =>
        Run(req.Image, async photo =>
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
            return Ok(new ImageSearchResponse(category, items, terms.Label, keywords));
        });

    private async Task<IActionResult> Run(string image, Func<Photo, Task<IActionResult>> analyse)
    {
        if (!ai.IsConfigured)
            return Problem(PhotoAiService.NotConfigured, statusCode: StatusCodes.Status503ServiceUnavailable,
                extensions: new Dictionary<string, object?> { ["code"] = PhotoAiService.NotConfiguredCode });
        if (Photo.FromBase64(image) is not { } photo)
            return Problem("Send image as a base64 JPEG, PNG, GIF or WebP of up to 3.75 MB.",
                statusCode: StatusCodes.Status400BadRequest);
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
