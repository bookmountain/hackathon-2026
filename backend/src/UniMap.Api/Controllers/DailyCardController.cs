using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Npgsql;
using UniMap.Api.Contracts;
using UniMap.Api.Data;
using UniMap.Api.Domain;
using UniMap.Api.Options;
using UniMap.Api.Services;

namespace UniMap.Api.Controllers;

/// <summary>
/// Dcard ("Daily card"): draw one card a day to meet a random fellow student. Draws are mutual: the student
/// you draw gets you as their card too. The deck resets at Adelaide midnight. Miss a day and your next
/// Draw only starts a new session: the deck locks until midnight, then you can draw again.
/// </summary>
[ApiController]
[Authorize]
[Route("api/daily-card")]
public class DailyCardController(
    AppDbContext db,
    ChatService chats,
    ConsentService consents,
    IOptions<DailyCardOptions> options,
    ILogger<DailyCardController> log) : ControllerBase
{
    /// <summary>Today's card: Ready, Matched (with the student you drew) or Missed, plus the clock.</summary>
    [HttpGet]
    public Task<DailyCardResponse> Today() => StateAsync(User.UserId(), AdelaideTime.Today());

    /// <summary>
    /// The "Draw a card" button. Deals you a student who hasn't drawn yet today, or reveals the student who
    /// already drew you. After a missed day (missedDay on GET /api/daily-card) it deals nothing and locks the
    /// deck until midnight instead (status Missed). Does nothing if you've already drawn today. 409 if nobody
    /// is left to draw.
    /// </summary>
    [HttpPost("draw")]
    public async Task<ActionResult<DailyCardResponse>> Draw()
    {
        var me = User.UserId();
        var today = AdelaideTime.Today();

        // Two students drawing at the same moment can pick the same partner. The unique (user, day) index
        // rejects the second save, which then tries again.
        for (var attempt = 0; attempt < 3; attempt++)
        {
            db.ChangeTracker.Clear();
            var mine = await db.DailyDraws.FirstOrDefaultAsync(d => d.UserId == me && d.Day == today);
            if (mine?.DrawnAt is not null) return await StateAsync(me, today);

            var now = DateTimeOffset.UtcNow;
            if (mine is { MatchedUserId: not null })
            {
                mine.DrawnAt = now; // Someone drew you first: they're your card
            }
            else
            {
                // No row yet, or one dealt by a student who has since deleted their account
                var row = mine ?? db.DailyDraws.Add(new DailyDraw { UserId = me, Day = today }).Entity;
                row.DrawnAt = now;
                if (!DailyCardRules.CanDraw(await LastPressedAsync(me, today), today))
                {
                    row.SessionRestart = true;
                }
                else if (await PickPartnerAsync(me, today) is { } partner)
                {
                    row.MatchedUserId = partner;
                    db.DailyDraws.Add(new DailyDraw { UserId = partner, Day = today, MatchedUserId = me });
                }
                else
                {
                    return Problem("Nobody is left to draw today. Try again later.", statusCode: StatusCodes.Status409Conflict);
                }
            }

            try
            {
                await db.SaveChangesAsync();
                return await StateAsync(me, today);
            }
            catch (DbUpdateException e) when (e.InnerException is PostgresException { SqlState: PostgresErrorCodes.UniqueViolation })
            {
                log.LogInformation("Dcard draw for {UserId} collided with another draw, retrying", me);
            }
        }
        return Problem("Lots of students are drawing right now. Try again.", statusCode: StatusCodes.Status409Conflict);
    }

    /// <summary>
    /// Demo servers only (DailyCard__DemoReset=true), for running the demo again: forgets all your draws so
    /// the deck is Ready, and hides you from anyone you'd been dealt to who hasn't drawn yet. With
    /// missedDay=true it also pretends your last draw was two days ago, so Draw shows the missed-day lock.
    /// 404 when the setting is off.
    /// </summary>
    [HttpPost("reset")]
    public async Task<ActionResult<DailyCardResponse>> Reset([FromQuery] bool missedDay = false)
    {
        if (!options.Value.DemoReset) return NotFound();
        var me = User.UserId();
        var today = AdelaideTime.Today();

        // Students who drew you keep their card; unrevealed ones dealt to you go, so they get a fresh pick
        await db.DailyDraws.Where(d => d.UserId == me).ExecuteDeleteAsync();
        await db.DailyDraws.Where(d => d.MatchedUserId == me && d.DrawnAt == null).ExecuteDeleteAsync();
        if (missedDay)
        {
            db.DailyDraws.Add(new DailyDraw
            {
                UserId = me,
                Day = today.AddDays(-2),
                DrawnAt = DateTimeOffset.UtcNow.AddDays(-2),
                SessionRestart = true,
            });
            await db.SaveChangesAsync();
        }
        log.LogInformation("Dcard demo reset for {UserId} (missedDay: {MissedDay})", me, missedDay);
        return await StateAsync(me, today);
    }

    private async Task<DailyCardResponse> StateAsync(Guid me, DateOnly today)
    {
        var mine = await db.DailyDraws.AsNoTracking()
            .Include(d => d.MatchedUser).ThenInclude(u => u!.Profile).ThenInclude(p => p!.Degree)
            .FirstOrDefaultAsync(d => d.UserId == me && d.Day == today && d.DrawnAt != null);
        var drawnToday = await db.DailyDraws.CountAsync(d => d.Day == today && d.DrawnAt != null && !d.SessionRestart);
        var nextChangeAt = DailyCardRules.NextChangeAt(today);
        var canReset = options.Value.DemoReset;

        if (mine is null)
        {
            var missed = !DailyCardRules.CanDraw(await LastPressedAsync(me, today), today);
            return new(DrawStatus.Ready, null, drawnToday, nextChangeAt, missed, null, canReset);
        }
        if (mine.SessionRestart)
            return new(DrawStatus.Missed, null, drawnToday, nextChangeAt, false, null, canReset);
        return new(DrawStatus.Matched, mine.MatchedUser is { } u ? chats.ToPerson(u) : null,
            drawnToday, nextChangeAt, false, mine.Id, canReset);
    }

    /// <summary>The last day before today on which the student pressed Draw, or null if they never have.</summary>
    private Task<DateOnly?> LastPressedAsync(Guid userId, DateOnly today) =>
        db.DailyDraws.Where(d => d.UserId == userId && d.DrawnAt != null && d.Day < today).MaxAsync(d => (DateOnly?)d.Day);

    /// <summary>
    /// A random student with a profile and the required consents, who has no card today and hasn't missed a
    /// day. Not the student you drew last time, unless nobody else is left.
    /// </summary>
    private async Task<Guid?> PickPartnerAsync(Guid me, DateOnly today)
    {
        var lastMatch = await db.DailyDraws
            .Where(d => d.UserId == me && d.Day < today && d.DrawnAt != null && d.MatchedUserId != null)
            .OrderByDescending(d => d.Day)
            .Select(d => d.MatchedUserId)
            .FirstOrDefaultAsync();

        var pool = await db.Profiles
            .Where(p => p.UserId != me && !db.DailyDraws.Any(d => d.UserId == p.UserId && d.Day == today))
            .Select(p => new
            {
                p.UserId,
                LastPressed = db.DailyDraws
                    .Where(d => d.UserId == p.UserId && d.DrawnAt != null && d.Day < today)
                    .Max(d => (DateOnly?)d.Day),
            })
            .ToListAsync();
        var eligible = pool.Where(c => DailyCardRules.CanDraw(c.LastPressed, today)).Select(c => c.UserId).ToList();
        var consented = await consents.CompleteAmongAsync(eligible);

        var ids = eligible.Where(consented.Contains).ToArray();
        Random.Shared.Shuffle(ids);
        return ids.OrderBy(id => id == lastMatch).Select(id => (Guid?)id).FirstOrDefault();
    }
}
