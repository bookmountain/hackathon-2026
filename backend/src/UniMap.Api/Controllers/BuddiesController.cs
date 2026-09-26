using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using UniMap.Api.Contracts;
using UniMap.Api.Data;
using UniMap.Api.Domain;
using UniMap.Api.Services;

namespace UniMap.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/buddies")]
public class BuddiesController(AppDbContext db, MatchingService matching, StorageService storage) : ControllerBase
{
    /// <summary>Ranked buddy suggestions based on the caller's questionnaire answers.</summary>
    [HttpGet("suggestions")]
    public async Task<ActionResult<List<BuddySuggestion>>> Suggestions([FromQuery] int limit = 20, CancellationToken ct = default)
    {
        if (!await db.Profiles.AnyAsync(p => p.UserId == User.UserId(), ct))
            return Problem("Complete your profile first.", statusCode: StatusCodes.Status409Conflict);
        return await matching.SuggestAsync(User.UserId(), Math.Clamp(limit, 1, 50), ct);
    }

    [HttpGet("connections")]
    public async Task<ActionResult<List<ConnectionDto>>> Connections()
    {
        var me = User.UserId();
        var rows = await db.BuddyConnections.AsNoTracking()
            .Include(c => c.Requester).ThenInclude(u => u.Profile).ThenInclude(p => p!.Degree)
            .Include(c => c.Addressee).ThenInclude(u => u.Profile).ThenInclude(p => p!.Degree)
            .Where(c => c.RequesterId == me || c.AddresseeId == me)
            .OrderByDescending(c => c.CreatedAt)
            .ToListAsync();

        return rows
            .Select(c => (c, other: c.RequesterId == me ? c.Addressee : c.Requester))
            .Where(x => x.other.Profile is not null)
            .Select(x => new ConnectionDto(x.c.Id, MatchingService.ToDto(x.other.Profile!, storage),
                x.c.Status, x.c.AddresseeId == me, x.c.CreatedAt))
            .ToList();
    }

    [HttpPost("{userId:guid}/request")]
    public async Task<IActionResult> SendRequest(Guid userId)
    {
        var me = User.UserId();
        if (userId == me) return Problem("You can't buddy yourself.", statusCode: StatusCodes.Status400BadRequest);
        if (!await db.Profiles.AnyAsync(p => p.UserId == userId)) return NotFound();

        var exists = await db.BuddyConnections.AnyAsync(c =>
            (c.RequesterId == me && c.AddresseeId == userId) || (c.RequesterId == userId && c.AddresseeId == me));
        if (exists) return Problem("A connection already exists.", statusCode: StatusCodes.Status409Conflict);

        db.BuddyConnections.Add(new BuddyConnection { RequesterId = me, AddresseeId = userId });
        await db.SaveChangesAsync();
        await matching.InvalidateAsync(me);
        await matching.InvalidateAsync(userId);
        return NoContent();
    }

    [HttpPost("connections/{id:guid}/accept")]
    public Task<IActionResult> Accept(Guid id) => Respond(id, ConnectionStatus.Accepted);

    [HttpPost("connections/{id:guid}/decline")]
    public Task<IActionResult> Decline(Guid id) => Respond(id, ConnectionStatus.Declined);

    private async Task<IActionResult> Respond(Guid id, ConnectionStatus status)
    {
        var c = await db.BuddyConnections.FirstOrDefaultAsync(c => c.Id == id && c.AddresseeId == User.UserId());
        if (c is null) return NotFound();
        if (c.Status != ConnectionStatus.Pending)
            return Problem("Request already answered.", statusCode: StatusCodes.Status409Conflict);
        c.Status = status;
        await db.SaveChangesAsync();
        return NoContent();
    }
}
