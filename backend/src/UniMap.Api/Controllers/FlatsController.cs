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
/// The "Flats" tab: rooms listed by students. Listings are only visible to signed-in (verified)
/// students, as the design promises.
/// </summary>
[ApiController]
[Authorize]
[Route("api/flats")]
public class FlatsController(AppDbContext db, StorageService storage) : ControllerBase
{
    private static readonly GeometryFactory Geo = NtsGeometryServices.Instance.CreateGeometryFactory(srid: 4326);

    /// <summary>Chip options for the "List a room" form, plus campus pins for the map.</summary>
    [AllowAnonymous]
    [HttpGet("options")]
    public FlatOptionsResponse Options() =>
        new(FlatCatalog.Features, FlatCatalog.HouseRhythm, Campuses.All, FlatCatalog.MaxPhotos);

    /// <summary>
    /// Search active listings, for both the map and the list view.
    /// The prototype's chips map to: "Under $250" = maxRent=249, "Furnished" = furnished=Fully,
    /// "Ensuite" = toilet=PrivateEnsuite, "Bills &lt; $30" = maxBills=29.
    /// </summary>
    /// <param name="minLat">Map viewport (all four bounds, or none).</param>
    /// <param name="campus">Campus id from /api/flats/options. With maxWalkMinutes, limits to rooms within walking distance.</param>
    /// <param name="features">Every listed feature must be present.</param>
    /// <param name="availableBy">Available on or before this date.</param>
    /// <param name="sort">newest (default), cheapest (rent + bills), or nearest (needs campus).</param>
    [HttpGet]
    public async Task<ActionResult<List<FlatSummary>>> Search(
        [FromQuery] double? minLat, [FromQuery] double? minLng, [FromQuery] double? maxLat, [FromQuery] double? maxLng,
        [FromQuery] int? maxRent, [FromQuery] int? maxBills, [FromQuery] Furnishing? furnished,
        [FromQuery] ToiletType? toilet, [FromQuery] BathroomType? bathroom, [FromQuery] List<string>? features,
        [FromQuery] DateOnly? availableBy, [FromQuery] string? campus, [FromQuery] int? maxWalkMinutes,
        [FromQuery] string sort = "newest", [FromQuery] int limit = 100)
    {
        var q = db.FlatListings.AsNoTracking().Where(f => f.Status == ListingStatus.Active);

        var bounds = new double?[] { minLat, minLng, maxLat, maxLng };
        if (bounds.Any(b => b is not null))
        {
            if (bounds.Any(b => b is null))
                return Problem("Send all four of minLat, minLng, maxLat, maxLng.", statusCode: StatusCodes.Status400BadRequest);
            var box = Geo.ToGeometry(new Envelope(minLng!.Value, maxLng!.Value, minLat!.Value, maxLat!.Value));
            q = q.Where(f => box.Covers(f.Location));
        }

        if (maxRent is not null) q = q.Where(f => f.RentPerWeek <= maxRent);
        if (maxBills is not null) q = q.Where(f => f.BillsPerWeek <= maxBills);
        if (furnished is not null) q = q.Where(f => f.Furnished == furnished);
        if (toilet is not null) q = q.Where(f => f.Toilet == toilet);
        if (bathroom is not null) q = q.Where(f => f.Bathroom == bathroom);
        if (availableBy is not null) q = q.Where(f => f.AvailableFrom == null || f.AvailableFrom <= availableBy);
        foreach (var feature in features ?? [])
            q = q.Where(f => f.Features.Contains(feature));

        Point? campusPoint = null;
        if (campus is not null)
        {
            if (Campuses.Find(campus) is not { } c)
                return Problem($"Unknown campus '{campus}'. See GET /api/flats/options.", statusCode: StatusCodes.Status400BadRequest);
            campusPoint = Geo.CreatePoint(new Coordinate(c.Lng, c.Lat));
            if (maxWalkMinutes is { } mins)
            {
                // Inverse of Campuses.WalkMinutes: straight-line metres that walk in `mins`.
                var metres = mins * 80 / 1.25;
                q = q.Where(f => f.Location.IsWithinDistance(campusPoint, metres));
            }
        }
        else if (sort == "nearest" || maxWalkMinutes is not null)
        {
            return Problem("sort=nearest and maxWalkMinutes need a campus.", statusCode: StatusCodes.Status400BadRequest);
        }

        q = sort switch
        {
            "cheapest" => q.OrderBy(f => f.RentPerWeek + f.BillsPerWeek),
            "nearest" => q.OrderBy(f => f.Location.Distance(campusPoint!)),
            "newest" => q.OrderByDescending(f => f.CreatedAt),
            _ => q.OrderByDescending(f => f.CreatedAt),
        };

        var rows = await q.Take(Math.Clamp(limit, 1, 200)).ToListAsync();
        var me = User.UserId();
        return rows.Select(f => FlatMapper.ToSummary(f, me, storage)).ToList();
    }

    /// <summary>Your own listings, including ones marked Taken.</summary>
    [HttpGet("mine")]
    public async Task<List<FlatSummary>> Mine()
    {
        var me = User.UserId();
        var rows = await db.FlatListings.AsNoTracking()
            .Where(f => f.OwnerId == me)
            .OrderByDescending(f => f.CreatedAt)
            .ToListAsync();
        return rows.Select(f => FlatMapper.ToSummary(f, me, storage)).ToList();
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<FlatDetail>> Get(Guid id)
    {
        var f = await LoadDetail(id);
        var me = User.UserId();
        if (f is null || (f.Status != ListingStatus.Active && f.OwnerId != me)) return NotFound();
        return FlatMapper.ToDetail(f, me, storage);
    }

    /// <summary>List a room. Upload photos first with POST /api/uploads/flat-photo.</summary>
    [HttpPost]
    public async Task<ActionResult<FlatDetail>> Create(UpsertFlatRequest req)
    {
        var me = User.UserId();
        if (!await db.Profiles.AnyAsync(p => p.UserId == me))
            return Problem("Complete your profile first.", statusCode: StatusCodes.Status409Conflict);
        if (Validate(req, me, existingKeys: []) is { } error) return error;

        var f = new FlatListing { OwnerId = me, Title = "", Suburb = "", Location = Geo.CreatePoint(new Coordinate(0, 0)) };
        Apply(f, req);
        db.FlatListings.Add(f);
        await db.SaveChangesAsync();

        var created = (await LoadDetail(f.Id))!;
        return CreatedAtAction(nameof(Get), new { id = f.Id }, FlatMapper.ToDetail(created, me, storage));
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<FlatDetail>> Update(Guid id, UpsertFlatRequest req)
    {
        var me = User.UserId();
        var f = await db.FlatListings.FirstOrDefaultAsync(x => x.Id == id && x.OwnerId == me);
        if (f is null) return NotFound();
        if (Validate(req, me, existingKeys: f.PhotoKeys) is { } error) return error;

        Apply(f, req);
        await db.SaveChangesAsync();
        return FlatMapper.ToDetail((await LoadDetail(id))!, me, storage);
    }

    /// <summary>Mark a room as Taken (hidden from search) or Active again.</summary>
    [HttpPut("{id:guid}/status")]
    public async Task<IActionResult> SetStatus(Guid id, FlatStatusRequest req)
    {
        var f = await db.FlatListings.FirstOrDefaultAsync(x => x.Id == id && x.OwnerId == User.UserId());
        if (f is null) return NotFound();
        f.Status = req.Status;
        f.UpdatedAt = DateTimeOffset.UtcNow;
        await db.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var f = await db.FlatListings.FirstOrDefaultAsync(x => x.Id == id && x.OwnerId == User.UserId());
        if (f is null) return NotFound();
        db.FlatListings.Remove(f);
        await db.SaveChangesAsync();
        return NoContent();
    }

    private Task<FlatListing?> LoadDetail(Guid id) =>
        db.FlatListings.AsNoTracking()
            .Include(f => f.Owner).ThenInclude(u => u.Profile).ThenInclude(p => p!.Degree)
            .FirstOrDefaultAsync(f => f.Id == id);

    private ObjectResult? Validate(UpsertFlatRequest req, Guid me, List<string> existingKeys)
    {
        var badFeature = (req.Features ?? []).FirstOrDefault(x => !FlatCatalog.Features.Contains(x));
        if (badFeature is not null)
            return Problem($"Unknown feature '{badFeature}'. See GET /api/flats/options.", statusCode: StatusCodes.Status400BadRequest);

        var badRhythm = (req.HouseRhythm ?? []).FirstOrDefault(x => !FlatCatalog.HouseRhythm.Contains(x));
        if (badRhythm is not null)
            return Problem($"Unknown house rhythm '{badRhythm}'. See GET /api/flats/options.", statusCode: StatusCodes.Status400BadRequest);

        // Photos must be ones this user uploaded (or already on the listing).
        var badKey = (req.PhotoKeys ?? []).FirstOrDefault(k => !k.StartsWith($"flats/{me}/") && !existingKeys.Contains(k));
        if (badKey is not null)
            return Problem($"Photo '{badKey}' wasn't uploaded by you. Use POST /api/uploads/flat-photo.", statusCode: StatusCodes.Status400BadRequest);

        if ((req.Housemates ?? []).Any(h => h.Length > 60))
            return Problem("Each housemate entry must be 60 characters or fewer.", statusCode: StatusCodes.Status400BadRequest);

        return null;
    }

    private static void Apply(FlatListing f, UpsertFlatRequest req)
    {
        f.Title = req.Title.Trim();
        f.Description = string.IsNullOrWhiteSpace(req.Description) ? null : req.Description.Trim();
        f.Suburb = req.Suburb.Trim();
        f.Street = string.IsNullOrWhiteSpace(req.Street) ? null : req.Street.Trim();
        f.Location = Geo.CreatePoint(new Coordinate(req.Lng, req.Lat));
        f.RentPerWeek = req.RentPerWeek;
        f.BillsPerWeek = req.BillsPerWeek;
        f.Bedrooms = req.Bedrooms;
        f.Flatmates = req.Flatmates;
        f.Toilet = req.Toilet;
        f.Bathroom = req.Bathroom;
        f.Furnished = req.Furnished;
        f.MinStayMonths = req.MinStayMonths;
        f.AvailableFrom = req.AvailableFrom;
        f.Features = (req.Features ?? []).Distinct().ToList();
        f.HouseRhythm = (req.HouseRhythm ?? []).Distinct().ToList();
        f.PreferredFlatmate = string.IsNullOrWhiteSpace(req.PreferredFlatmate) ? null : req.PreferredFlatmate.Trim();
        f.Housemates = (req.Housemates ?? []).Select(h => h.Trim()).Where(h => h.Length > 0).ToList();
        f.PhotoKeys = (req.PhotoKeys ?? []).Distinct().ToList();
        f.UpdatedAt = DateTimeOffset.UtcNow;
    }
}
