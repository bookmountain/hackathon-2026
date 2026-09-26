using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NetTopologySuite;
using NetTopologySuite.Geometries;
using UniMap.Api.Contracts;
using UniMap.Api.Data;
using UniMap.Api.Domain;
using UniMap.Api.Services;

namespace UniMap.Api.Controllers;

/// <summary>
/// The "Market" tab: things students sell, picked up at a safe pickup point or the seller's own pin.
/// Only visible to signed-in (verified) students.
/// </summary>
[ApiController]
[Authorize]
[Route("api/items")]
public class ItemsController(AppDbContext db, StorageService storage) : ControllerBase
{
    private static readonly GeometryFactory Geo = NtsGeometryServices.Instance.CreateGeometryFactory(srid: 4326);

    /// <summary>Categories, conditions and safe pickup points for the Sell form and filter chips.</summary>
    [AllowAnonymous]
    [HttpGet("options")]
    public ItemOptionsResponse Options() => new(
        Enum.GetValues<ItemCategory>().Select(c => new LabeledOption<ItemCategory>(c, MarketCatalog.Label(c))),
        Enum.GetValues<ItemCondition>().Select(c => new LabeledOption<ItemCondition>(c, MarketCatalog.Label(c))),
        PickupPoints.All,
        MarketCatalog.MaxPhotos);

    /// <summary>
    /// Search items, for the map and the grid. Sold items are left out unless includeSold=true (the
    /// prototype's grid shows them greyed out; the map doesn't).
    /// </summary>
    /// <param name="category">The filter chip. Leave out for "All".</param>
    /// <param name="search">Matches the title or description ("Search textbooks, desks, tech…").</param>
    /// <param name="pickupPoint">Items at one pickup point (tapping a ★ pin on the map).</param>
    /// <param name="minLat">Map viewport (all four bounds, or none).</param>
    /// <param name="sort">newest (default) or cheapest.</param>
    [HttpGet]
    public async Task<ActionResult<List<ItemSummary>>> Search(
        [FromQuery] ItemCategory? category, [FromQuery] string? search, [FromQuery] string? pickupPoint,
        [FromQuery] int? maxPrice, [FromQuery] bool includeSold,
        [FromQuery] double? minLat, [FromQuery] double? minLng, [FromQuery] double? maxLat, [FromQuery] double? maxLng,
        [FromQuery] string sort = "newest", [FromQuery] int limit = 100)
    {
        var q = db.MarketItems.AsNoTracking();
        if (!includeSold) q = q.Where(i => i.Availability != ItemAvailability.Sold);

        var bounds = new double?[] { minLat, minLng, maxLat, maxLng };
        if (bounds.Any(b => b is not null))
        {
            if (bounds.Any(b => b is null))
                return Problem("Send all four of minLat, minLng, maxLat, maxLng.", statusCode: StatusCodes.Status400BadRequest);
            var box = Geo.ToGeometry(new Envelope(minLng!.Value, maxLng!.Value, minLat!.Value, maxLat!.Value));
            q = q.Where(i => box.Covers(i.Location));
        }

        if (pickupPoint is not null)
        {
            if (PickupPoints.Find(pickupPoint) is null)
                return Problem($"Unknown pickup point '{pickupPoint}'. See GET /api/items/options.", statusCode: StatusCodes.Status400BadRequest);
            q = q.Where(i => i.PickupPointId == pickupPoint);
        }

        if (category is not null) q = q.Where(i => i.Category == category);
        if (maxPrice is not null) q = q.Where(i => i.Price <= maxPrice);
        if (!string.IsNullOrWhiteSpace(search))
        {
            var pattern = $"%{EscapeLike(search.Trim())}%";
            q = q.Where(i => EF.Functions.ILike(i.Title, pattern, @"\")
                || (i.Description != null && EF.Functions.ILike(i.Description, pattern, @"\")));
        }

        q = sort switch
        {
            "cheapest" => q.OrderBy(i => i.Price).ThenByDescending(i => i.CreatedAt),
            "newest" => q.OrderByDescending(i => i.CreatedAt),
            _ => q.OrderByDescending(i => i.CreatedAt),
        };

        var rows = await q.Take(Math.Clamp(limit, 1, 200)).ToListAsync();
        var me = User.UserId();
        return rows.Select(i => ItemMapper.ToSummary(i, me, storage)).ToList();
    }

    /// <summary>The ★ pickup points for the map, with how many items are waiting at each.</summary>
    /// <param name="category">Count only this category, to match the selected filter chip.</param>
    [HttpGet("pickup-points")]
    public async Task<List<PickupPointSummary>> PickupPointPins([FromQuery] ItemCategory? category)
    {
        var q = db.MarketItems.AsNoTracking()
            .Where(i => i.PickupPointId != null && i.Availability != ItemAvailability.Sold);
        if (category is not null) q = q.Where(i => i.Category == category);
        var counts = await q.GroupBy(i => i.PickupPointId!)
            .Select(g => new { g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.Key, x => x.Count);
        return PickupPoints.All
            .Select(p => new PickupPointSummary(p.Id, p.Name, p.ShortName, p.Note, p.Lat, p.Lng, counts.GetValueOrDefault(p.Id)))
            .ToList();
    }

    /// <summary>Your own items, including sold ones.</summary>
    [HttpGet("mine")]
    public async Task<List<ItemSummary>> Mine()
    {
        var me = User.UserId();
        var rows = await db.MarketItems.AsNoTracking()
            .Where(i => i.SellerId == me)
            .OrderByDescending(i => i.CreatedAt)
            .ToListAsync();
        return rows.Select(i => ItemMapper.ToSummary(i, me, storage)).ToList();
    }

    /// <summary>Item detail, with the seller's nickname, major, uni and avatar. Sold items can still be viewed.</summary>
    [HttpGet("{id:guid}")]
    public async Task<ActionResult<ItemDetail>> Get(Guid id)
    {
        var i = await LoadDetail(id);
        if (i is null) return NotFound();
        return ItemMapper.ToDetail(i, User.UserId(), storage);
    }

    /// <summary>
    /// Sell an item. Upload at least one photo first with POST /api/uploads/item-photo (and PUT the image to
    /// its uploadUrl), then send its itemId as "id" and the keys as photoKeys.
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<ItemDetail>> Create(UpsertItemRequest req)
    {
        var me = User.UserId();
        if (!await db.Profiles.AnyAsync(p => p.UserId == me))
            return Problem("Complete your profile first.", statusCode: StatusCodes.Status409Conflict);
        var id = req.Id ?? Guid.NewGuid();
        if (await db.MarketItems.AnyAsync(x => x.Id == id))
            return Problem("An item with this id already exists. Use PUT to edit it.", statusCode: StatusCodes.Status409Conflict);
        if (req.Availability == ItemAvailability.Sold)
            return Problem("A new item can't be Sold.", statusCode: StatusCodes.Status400BadRequest);
        if (await Validate(req, id, existingKeys: []) is { } error) return error;

        var i = new MarketItem { Id = id, SellerId = me, Title = "", Location = Geo.CreatePoint(new Coordinate(0, 0)) };
        Apply(i, req);
        db.MarketItems.Add(i);
        await db.SaveChangesAsync();

        var created = (await LoadDetail(i.Id))!;
        return CreatedAtAction(nameof(Get), new { id = i.Id }, ItemMapper.ToDetail(created, me, storage));
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<ItemDetail>> Update(Guid id, UpsertItemRequest req)
    {
        var me = User.UserId();
        var i = await db.MarketItems.FirstOrDefaultAsync(x => x.Id == id && x.SellerId == me);
        if (i is null) return NotFound();
        if (await Validate(req, id, existingKeys: i.PhotoKeys) is { } error) return error;

        Apply(i, req);
        await db.SaveChangesAsync();
        return ItemMapper.ToDetail((await LoadDetail(id))!, me, storage);
    }

    /// <summary>Change availability only, e.g. mark the item Pending or Sold.</summary>
    [HttpPut("{id:guid}/availability")]
    public async Task<IActionResult> SetAvailability(Guid id, ItemAvailabilityRequest req)
    {
        var i = await db.MarketItems.FirstOrDefaultAsync(x => x.Id == id && x.SellerId == User.UserId());
        if (i is null) return NotFound();
        if (ValidateAvailability(req.Availability!.Value, req.AvailableFrom) is { } error) return error;
        SetAvailability(i, req.Availability.Value, req.AvailableFrom);
        i.UpdatedAt = DateTimeOffset.UtcNow;
        await db.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var i = await db.MarketItems.FirstOrDefaultAsync(x => x.Id == id && x.SellerId == User.UserId());
        if (i is null) return NotFound();
        db.MarketItems.Remove(i);
        await db.SaveChangesAsync();
        return NoContent();
    }

    private Task<MarketItem?> LoadDetail(Guid id) =>
        db.MarketItems.AsNoTracking()
            .Include(i => i.Seller).ThenInclude(u => u.Profile).ThenInclude(p => p!.Degree)
            .FirstOrDefaultAsync(i => i.Id == id);

    private async Task<ObjectResult?> Validate(UpsertItemRequest req, Guid itemId, List<string> existingKeys)
    {
        if (ValidateAvailability(req.Availability!.Value, req.AvailableFrom) is { } availabilityError)
            return availabilityError;

        if (req.PickupPointId is not null)
        {
            if (PickupPoints.Find(req.PickupPointId) is null)
                return Problem($"Unknown pickup point '{req.PickupPointId}'. See GET /api/items/options.",
                    statusCode: StatusCodes.Status400BadRequest);
            if (req.Lat is not null || req.Lng is not null)
                return Problem("Send either pickupPointId or lat/lng for your own pin, not both.",
                    statusCode: StatusCodes.Status400BadRequest);
        }
        else if (req.Lat is null || req.Lng is null)
        {
            return Problem("Choose a pickup point (pickupPointId), or send lat and lng for your own pin.",
                statusCode: StatusCodes.Status400BadRequest);
        }

        var keys = (req.PhotoKeys ?? []).Distinct().ToList();
        if (keys.Count == 0)
            return Problem("Add at least one photo. Upload it with POST /api/uploads/item-photo.",
                statusCode: StatusCodes.Status400BadRequest);

        // Photos must be uploaded for this item (its own R2 folder), or already be on it.
        var newKeys = keys.Where(k => !existingKeys.Contains(k)).ToList();
        var badKey = newKeys.FirstOrDefault(k => !k.StartsWith($"items/{itemId}/"));
        if (badKey is not null)
            return Problem($"Photo '{badKey}' wasn't uploaded for this item. Use POST /api/uploads/item-photo with itemId {itemId}.",
                statusCode: StatusCodes.Status400BadRequest);

        // A photo is required, so check the upload actually happened, not just that a key was issued.
        if (storage.IsConfigured)
            foreach (var key in newKeys)
                if (!await storage.ExistsAsync(key))
                    return Problem($"Photo '{key}' hasn't been uploaded yet. PUT the image to the uploadUrl from POST /api/uploads/item-photo first.",
                        statusCode: StatusCodes.Status400BadRequest);

        return null;
    }

    private ObjectResult? ValidateAvailability(ItemAvailability availability, DateOnly? from)
    {
        if (availability != ItemAvailability.From) return null;
        if (from is null)
            return Problem("Send availableFrom when availability is From.", statusCode: StatusCodes.Status400BadRequest);
        if (from <= DateOnly.FromDateTime(DateTime.UtcNow))
            return Problem("availableFrom must be in the future. Use Now if it's available today.",
                statusCode: StatusCodes.Status400BadRequest);
        return null;
    }

    private static void SetAvailability(MarketItem i, ItemAvailability availability, DateOnly? from)
    {
        i.Availability = availability;
        i.AvailableFrom = availability == ItemAvailability.From ? from : null;
    }

    private static void Apply(MarketItem i, UpsertItemRequest req)
    {
        i.Title = req.Title.Trim();
        i.Price = req.Price!.Value;
        i.Description = string.IsNullOrWhiteSpace(req.Description) ? null : req.Description.Trim();
        i.Category = req.Category!.Value;
        i.Condition = req.Condition!.Value;
        i.ConditionNote = string.IsNullOrWhiteSpace(req.ConditionNote) ? null : req.ConditionNote.Trim();
        SetAvailability(i, req.Availability!.Value, req.AvailableFrom);

        if (req.PickupPointId is not null)
        {
            var p = PickupPoints.Find(req.PickupPointId)!;
            i.PickupPointId = p.Id;
            i.PlaceName = null;
            i.Location = Geo.CreatePoint(new Coordinate(p.Lng, p.Lat));
        }
        else
        {
            i.PickupPointId = null;
            i.PlaceName = string.IsNullOrWhiteSpace(req.PlaceName) ? null : req.PlaceName.Trim();
            i.Location = Geo.CreatePoint(new Coordinate(req.Lng!.Value, req.Lat!.Value));
        }

        i.PhotoKeys = (req.PhotoKeys ?? []).Distinct().ToList();
        i.UpdatedAt = DateTimeOffset.UtcNow;
    }

    /// <summary>So "%" and "_" in a search are matched literally.</summary>
    private static string EscapeLike(string s) =>
        s.Replace(@"\", @"\\").Replace("%", @"\%").Replace("_", @"\_");
}
