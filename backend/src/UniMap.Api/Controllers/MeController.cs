using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using UniMap.Api.Contracts;
using UniMap.Api.Data;
using UniMap.Api.Domain;
using UniMap.Api.Hubs;
using UniMap.Api.Services;

namespace UniMap.Api.Controllers;

[ApiController]
[Authorize(Policy = ConsentPolicy.SignedInOnly)] // GET works before consent; editing needs it (below)
[Route("api/me")]
public class MeController(
    AppDbContext db,
    StorageService storage,
    ConsentService consents,
    IHubContext<ChatHub> hub,
    ILogger<MeController> log) : ControllerBase
{
    /// <summary>Works before consent, so the app can decide which onboarding screen to show.</summary>
    [HttpGet]
    public async Task<ActionResult<MeResponse>> Get()
    {
        var user = await db.Users.Include(u => u.Profile).ThenInclude(p => p!.Degree)
            .FirstOrDefaultAsync(u => u.Id == User.UserId());
        if (user is null) return NotFound();

        var profile = user.Profile is null ? null : ProfileMapper.ToDto(user.Profile, storage);
        return new MeResponse(user.Id, user.Email, user.University, await consents.IsCompleteAsync(user.Id), profile);
    }

    /// <summary>
    /// Create or update the onboarding questionnaire. Pick the degree with the /api/degrees dropdowns and
    /// send its id; department is then filled in from the degree's college.
    /// </summary>
    [HttpPut("profile")]
    [Authorize] // default policy: signed in + required consents
    public async Task<ActionResult<ProfileDto>> UpsertProfile(UpsertProfileRequest req)
    {
        var userId = User.UserId();
        var user = await db.Users.Include(u => u.Profile).FirstOrDefaultAsync(u => u.Id == userId);
        if (user is null) return NotFound();

        Degree? degree = null;
        if (req.DegreeId is { } degreeId)
        {
            degree = await db.Degrees.FirstOrDefaultAsync(d => d.Id == degreeId);
            if (degree is null || degree.University != user.University)
                return Problem($"Degree {degreeId} doesn't exist at {user.University}. See GET /api/degrees.",
                    statusCode: StatusCodes.Status400BadRequest);
        }
        else if (string.IsNullOrWhiteSpace(req.Department))
        {
            return Problem("Send a degreeId (preferred) or a department.", statusCode: StatusCodes.Status400BadRequest);
        }

        if (req.AvatarKey is not null && !req.AvatarKey.StartsWith($"avatars/{userId}/"))
            return Problem("Invalid avatar key.", statusCode: StatusCodes.Status400BadRequest);

        var p = user.Profile ??= new Profile { UserId = userId, DisplayName = "", Department = "" };
        p.DisplayName = req.DisplayName.Trim();
        p.DegreeId = degree?.Id;
        p.Degree = degree;
        p.Department = degree?.College ?? req.Department!.Trim();
        p.Gender = req.Gender;
        p.Pronouns = string.IsNullOrWhiteSpace(req.Pronouns) ? null : req.Pronouns.Trim();
        p.YearOfStudy = req.YearOfStudy;
        p.Bio = req.Bio?.Trim();
        p.Habits = Catalog.Normalize(req.Habits);
        p.Interests = Catalog.Normalize(req.Interests);
        p.AvatarKey = req.AvatarKey;
        p.AvatarPreset = req.AvatarPreset;
        var style = req.AvatarStyle ?? new AvatarStyle(default, null, default, default, default);
        p.AvatarMode = style.Mode;
        p.AvatarText = string.IsNullOrWhiteSpace(style.Text) ? null : style.Text.Trim().ToUpperInvariant();
        p.AvatarIcon = style.Icon;
        p.AvatarShape = style.Shape;
        p.AvatarRing = style.Ring;
        p.UpdatedAt = DateTimeOffset.UtcNow;

        await db.SaveChangesAsync();
        return ProfileMapper.ToDto(p, storage);
    }

    /// <summary>
    /// Delete your account and everything in it: profile, consents, rooms, items, the events you host,
    /// the events you joined, and your chats (the other person loses them too), plus your photos in R2.
    /// Works before consent. People going to an event you host get "eventCancelled"; events you were
    /// going to get a new "eventGoing" headcount. Sign the app out afterwards: the token no longer has an account.
    /// </summary>
    [HttpDelete]
    public async Task<IActionResult> Delete()
    {
        var me = User.UserId();
        var user = await db.Users.FirstOrDefaultAsync(u => u.Id == me);
        if (user is null) return NotFound();

        var flatIds = await db.FlatListings.Where(f => f.OwnerId == me).Select(f => f.Id).ToListAsync();
        var itemIds = await db.MarketItems.Where(i => i.SellerId == me).Select(i => i.Id).ToListAsync();
        var hosted = await db.MeetupEvents.Where(e => e.HostId == me)
            .Select(e => new
            {
                e.Id,
                e.Title,
                Guests = e.Attendees.Where(a => a.UserId != me).Select(a => a.UserId.ToString()).ToList(),
            })
            .ToListAsync();
        var joined = await db.EventAttendees.Where(a => a.UserId == me && a.Event.HostId != me)
            .Select(a => a.EventId).ToListAsync();

        // Everything else (profile, consents, listings, events, RSVPs, chats) cascades in the database
        db.Users.Remove(user);
        await db.SaveChangesAsync();

        if (storage.IsConfigured)
        {
            var folders = flatIds.Select(id => $"flats/{id}/")
                .Concat(itemIds.Select(id => $"items/{id}/"))
                .Prepend($"avatars/{me}/");
            foreach (var folder in folders)
            {
                // The account is already gone, so a storage hiccup only leaves orphaned photos behind
                try { await storage.DeleteFolderAsync(folder); }
                catch (Exception e) { log.LogWarning(e, "Couldn't delete {Folder} for deleted user {UserId}", folder, me); }
            }
        }

        foreach (var e in hosted.Where(e => e.Guests.Count > 0))
            await hub.Clients.Users(e.Guests).SendAsync("eventCancelled", new { eventId = e.Id, title = e.Title });
        foreach (var eventId in joined)
        {
            var going = await db.EventAttendees.CountAsync(a => a.EventId == eventId);
            await hub.Clients.All.SendAsync("eventGoing", new { eventId, goingCount = going });
        }
        return NoContent();
    }
}
