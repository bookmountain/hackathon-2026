using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using NetTopologySuite;
using NetTopologySuite.Geometries;
using UniMap.Api.Contracts;
using UniMap.Api.Data;
using UniMap.Api.Domain;
using UniMap.Api.Hubs;
using UniMap.Api.Services;

namespace UniMap.Api.Controllers;

/// <summary>
/// The "Meetups" tab: walk-in events anyone can host. Hosts and guests stay anonymous: no endpoint returns
/// who hosts an event or who's going, only the headcount and whether you yourself are hosting or going.
/// </summary>
[ApiController]
[Authorize]
[Route("api/events")]
public class EventsController(AppDbContext db, IHubContext<ChatHub> hub) : ControllerBase
{
    private static readonly GeometryFactory Geo = NtsGeometryServices.Instance.CreateGeometryFactory(srid: 4326);

    /// <summary>Event types, preset places and the capacity slider's range, for the Host form.</summary>
    [AllowAnonymous]
    [HttpGet("options")]
    public EventOptionsResponse Options() => new(
        Enum.GetValues<EventType>().Select(t => new LabeledOption<EventType>(t, t.ToString())),
        PickupPoints.All,
        MeetupCatalog.MinCapacity, MeetupCatalog.MaxCapacity, MeetupCatalog.DefaultCapacity);

    /// <summary>
    /// Upcoming events, soonest first, for the map and the list. Events that have ended are left out
    /// (without an end time, 2 hours after they start). Events happening now are included.
    /// </summary>
    /// <param name="type">Only this type (Study, Casual, Social or Food).</param>
    /// <param name="search">The search box ("Search meetups &amp; events"): matches the title or the place's name.</param>
    /// <param name="minLat">Map viewport (all four bounds, or none).</param>
    [HttpGet]
    public async Task<ActionResult<List<EventSummary>>> Search(
        [FromQuery] EventType? type,
        [FromQuery] string? search,
        [FromQuery] double? minLat, [FromQuery] double? minLng, [FromQuery] double? maxLat, [FromQuery] double? maxLng,
        [FromQuery] int limit = 100)
    {
        var now = DateTimeOffset.UtcNow;
        var q = Upcoming(db.MeetupEvents.AsNoTracking(), now);

        var bounds = new double?[] { minLat, minLng, maxLat, maxLng };
        if (bounds.Any(b => b is not null))
        {
            if (bounds.Any(b => b is null))
                return Problem("Send all four of minLat, minLng, maxLat, maxLng.", statusCode: StatusCodes.Status400BadRequest);
            var box = Geo.ToGeometry(new Envelope(minLng!.Value, maxLng!.Value, minLat!.Value, maxLat!.Value));
            q = q.Where(e => box.Covers(e.Location));
        }
        if (type is not null) q = q.Where(e => e.Type == type);
        if (!string.IsNullOrWhiteSpace(search))
        {
            // A preset place shows its own name unless the host gave it one (EventMapper.Place)
            var pattern = SqlLike.Contains(search);
            var presets = PickupPoints.All
                .Where(p => p.Name.Contains(search.Trim(), StringComparison.OrdinalIgnoreCase))
                .Select(p => p.Id).ToList();
            q = q.Where(e => EF.Functions.ILike(e.Title, pattern, SqlLike.Escape)
                || (e.PlaceName != null && EF.Functions.ILike(e.PlaceName, pattern, SqlLike.Escape))
                || (e.PlaceName == null && e.PlaceId != null && presets.Contains(e.PlaceId)));
        }

        var me = User.UserId();
        var rows = await q.OrderBy(e => e.StartsAt).ThenBy(e => e.Id)
            .Take(Math.Clamp(limit, 1, 200))
            .WithCounts(me).ToListAsync();
        return rows.Select(r => EventMapper.ToSummary(r, me, now)).ToList();
    }

    /// <summary>Events you host, including past ones, newest start time first.</summary>
    [HttpGet("mine")]
    public async Task<List<EventSummary>> Mine()
    {
        var me = User.UserId();
        var now = DateTimeOffset.UtcNow;
        var rows = await db.MeetupEvents.AsNoTracking()
            .Where(e => e.HostId == me)
            .OrderByDescending(e => e.StartsAt)
            .WithCounts(me).ToListAsync();
        return rows.Select(r => EventMapper.ToSummary(r, me, now)).ToList();
    }

    /// <summary>Upcoming events you've joined, soonest first.</summary>
    [HttpGet("going")]
    public async Task<List<EventSummary>> Going()
    {
        var me = User.UserId();
        var now = DateTimeOffset.UtcNow;
        var rows = await Upcoming(db.MeetupEvents.AsNoTracking(), now)
            .Where(e => e.Attendees.Any(a => a.UserId == me))
            .OrderBy(e => e.StartsAt)
            .WithCounts(me).ToListAsync();
        return rows.Select(r => EventMapper.ToSummary(r, me, now)).ToList();
    }

    /// <summary>Event detail. The host is never named: show "Hosted anonymously · Verified student host".</summary>
    [HttpGet("{id:guid}")]
    public async Task<ActionResult<EventDetail>> Get(Guid id)
    {
        var me = User.UserId();
        var row = await Load(id, me);
        if (row is null) return NotFound();
        return EventMapper.ToDetail(row, me, DateTimeOffset.UtcNow);
    }

    /// <summary>
    /// Host an event ("Publish event"). You're counted as going, as in the prototype, and nobody is told
    /// you're the host.
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<EventDetail>> Create(UpsertEventRequest req)
    {
        var me = User.UserId();
        if (!await db.Profiles.AnyAsync(p => p.UserId == me))
            return Problem("Complete your profile first.", statusCode: StatusCodes.Status409Conflict);
        if (Validate(req, existing: null) is { } error) return error;

        var e = new MeetupEvent { HostId = me, Title = "", Location = Geo.CreatePoint(new Coordinate(0, 0)) };
        Apply(e, req);
        e.Attendees.Add(new EventAttendee { UserId = me });
        db.MeetupEvents.Add(e);
        await db.SaveChangesAsync();

        var row = (await Load(e.Id, me))!;
        return CreatedAtAction(nameof(Get), new { id = e.Id }, EventMapper.ToDetail(row, me, DateTimeOffset.UtcNow));
    }

    /// <summary>Edit your event. Everyone going gets an "eventUpdated" SignalR event.</summary>
    [HttpPut("{id:guid}")]
    public async Task<ActionResult<EventDetail>> Update(Guid id, UpsertEventRequest req)
    {
        var me = User.UserId();
        var e = await db.MeetupEvents.FirstOrDefaultAsync(x => x.Id == id && x.HostId == me);
        if (e is null) return NotFound();
        if (Validate(req, existing: e) is { } error) return error;
        var going = await db.EventAttendees.CountAsync(a => a.EventId == id);
        if ((req.Capacity ?? MeetupCatalog.DefaultCapacity) < going)
            return Problem($"{going} people are already going, so capacity can't be lower than that.",
                statusCode: StatusCodes.Status400BadRequest);

        Apply(e, req);
        await db.SaveChangesAsync();
        await NotifyAttendeesAsync(id, me, "eventUpdated", new { eventId = id });
        return EventMapper.ToDetail((await Load(id, me))!, me, DateTimeOffset.UtcNow);
    }

    /// <summary>Cancel your event. Everyone going gets an "eventCancelled" SignalR event.</summary>
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var me = User.UserId();
        var e = await db.MeetupEvents.FirstOrDefaultAsync(x => x.Id == id && x.HostId == me);
        if (e is null) return NotFound();
        var attendees = await db.EventAttendees.Where(a => a.EventId == id && a.UserId != me)
            .Select(a => a.UserId.ToString()).ToListAsync();
        db.MeetupEvents.Remove(e);
        await db.SaveChangesAsync();
        if (attendees.Count > 0)
            await hub.Clients.Users(attendees).SendAsync("eventCancelled", new { eventId = id, title = e.Title });
        return NoContent();
    }

    /// <summary>
    /// "Join": count yourself in. Does nothing if you're already going. 409 if the event is full or over.
    /// The app shows "You're in. Just walk in — no one sees your name."
    /// </summary>
    [HttpPost("{id:guid}/join")]
    public async Task<ActionResult<EventSummary>> Join(Guid id)
    {
        var me = User.UserId();
        var now = DateTimeOffset.UtcNow;
        await using (var tx = await db.Database.BeginTransactionAsync())
        {
            // Lock the event so two last-spot joins can't both get in.
            var e = await db.MeetupEvents.FromSql($"SELECT * FROM meetup_events WHERE id = {id} FOR UPDATE")
                .FirstOrDefaultAsync();
            if (e is null) return NotFound();
            if (!await db.EventAttendees.AnyAsync(a => a.EventId == id && a.UserId == me))
            {
                if (MeetupCatalog.EndOf(e) <= now)
                    return Problem("This event is over.", statusCode: StatusCodes.Status409Conflict);
                if (await db.EventAttendees.CountAsync(a => a.EventId == id) >= e.Capacity)
                    return Problem("This event is full.", statusCode: StatusCodes.Status409Conflict);
                db.EventAttendees.Add(new EventAttendee { EventId = id, UserId = me });
                await db.SaveChangesAsync();
            }
            await tx.CommitAsync();
        }
        return await SummaryAndBroadcast(id, me, now);
    }

    /// <summary>Tap "Going ✓" again to leave. Does nothing if you weren't going.</summary>
    [HttpDelete("{id:guid}/join")]
    public async Task<ActionResult<EventSummary>> Leave(Guid id)
    {
        var me = User.UserId();
        if (!await db.MeetupEvents.AnyAsync(e => e.Id == id)) return NotFound();
        await db.EventAttendees.Where(a => a.EventId == id && a.UserId == me).ExecuteDeleteAsync();
        return await SummaryAndBroadcast(id, me, DateTimeOffset.UtcNow);
    }

    /// <summary>Returns the new summary, and pushes the new headcount to everyone ("eventGoing").</summary>
    private async Task<EventSummary> SummaryAndBroadcast(Guid id, Guid me, DateTimeOffset now)
    {
        var summary = EventMapper.ToSummary((await Load(id, me))!, me, now);
        await hub.Clients.All.SendAsync("eventGoing", new { eventId = id, goingCount = summary.GoingCount });
        return summary;
    }

    private async Task NotifyAttendeesAsync(Guid id, Guid except, string name, object payload)
    {
        var users = await db.EventAttendees.Where(a => a.EventId == id && a.UserId != except)
            .Select(a => a.UserId.ToString()).ToListAsync();
        if (users.Count > 0) await hub.Clients.Users(users).SendAsync(name, payload);
    }

    private Task<EventRow?> Load(Guid id, Guid me) =>
        db.MeetupEvents.AsNoTracking().Where(e => e.Id == id).WithCounts(me).FirstOrDefaultAsync();

    /// <summary>Not over yet. An event with no end time counts as over 2 hours after it starts.</summary>
    private static IQueryable<MeetupEvent> Upcoming(IQueryable<MeetupEvent> q, DateTimeOffset now)
    {
        var startedBefore = now - MeetupCatalog.DefaultLength;
        return q.Where(e => e.EndsAt != null ? e.EndsAt > now : e.StartsAt > startedBefore);
    }

    private ObjectResult? Validate(UpsertEventRequest req, MeetupEvent? existing)
    {
        var now = DateTimeOffset.UtcNow;
        var start = req.StartsAt!.Value;
        // An event that has already started can still be edited, as long as the start time stays the same.
        if (start != existing?.StartsAt && start <= now)
            return Problem("startsAt must be in the future.", statusCode: StatusCodes.Status400BadRequest);
        if (start > now + MeetupCatalog.MaxAhead)
            return Problem("Events can be hosted up to 180 days ahead.", statusCode: StatusCodes.Status400BadRequest);
        if (req.EndsAt is { } end && (end <= start || end - start > MeetupCatalog.MaxLength))
            return Problem("endsAt must be after startsAt, and at most 12 hours later.", statusCode: StatusCodes.Status400BadRequest);

        if (req.PlaceId is not null)
        {
            if (PickupPoints.Find(req.PlaceId) is null)
                return Problem($"Unknown place '{req.PlaceId}'. See GET /api/events/options.",
                    statusCode: StatusCodes.Status400BadRequest);
            if (req.Lat is not null || req.Lng is not null)
                return Problem("Send either placeId or lat/lng for your own pin, not both.",
                    statusCode: StatusCodes.Status400BadRequest);
        }
        else if (req.Lat is null || req.Lng is null)
        {
            return Problem("Choose a place (placeId), or send lat and lng to drop a pin.",
                statusCode: StatusCodes.Status400BadRequest);
        }
        return null;
    }

    private static void Apply(MeetupEvent e, UpsertEventRequest req)
    {
        e.Title = req.Title.Trim();
        e.Type = req.Type!.Value;
        e.StartsAt = req.StartsAt!.Value.ToUniversalTime();
        e.EndsAt = req.EndsAt?.ToUniversalTime();
        e.Description = string.IsNullOrWhiteSpace(req.Description) ? null : req.Description.Trim();
        e.Capacity = req.Capacity ?? MeetupCatalog.DefaultCapacity;
        e.WalkInsWelcome = req.WalkInsWelcome ?? true;

        var name = string.IsNullOrWhiteSpace(req.PlaceName) ? null : req.PlaceName.Trim();
        if (req.PlaceId is not null)
        {
            var p = PickupPoints.Find(req.PlaceId)!;
            e.PlaceId = p.Id;
            e.PlaceName = name;
            e.Location = Geo.CreatePoint(new Coordinate(p.Lng, p.Lat));
        }
        else
        {
            e.PlaceId = null;
            e.PlaceName = name ?? MeetupCatalog.PinnedLocation;
            e.Location = Geo.CreatePoint(new Coordinate(req.Lng!.Value, req.Lat!.Value));
        }
        e.UpdatedAt = DateTimeOffset.UtcNow;
    }
}
