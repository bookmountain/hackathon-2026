using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using UniMap.Api.Contracts;
using UniMap.Api.Data;
using UniMap.Api.Domain;
using UniMap.Api.Services;

namespace UniMap.Api.Controllers;

/// <summary>
/// One-to-one chats between students ("Message tenant", "Connect" on the map). Other people only see
/// your nickname, major, uni and avatar. New messages also arrive in real time on /hubs/chat.
/// </summary>
[ApiController]
[Authorize]
[Route("api/chats")]
public class ChatsController(AppDbContext db, ChatService chats) : ControllerBase
{
    /// <summary>Your chats, most recent first, with the last message and unread count.</summary>
    [HttpGet]
    public async Task<List<ChatSummary>> List()
    {
        var me = User.UserId();
        var convs = await db.Conversations.AsNoTracking()
            .Include(c => c.UserA).ThenInclude(u => u.Profile).ThenInclude(p => p!.Degree)
            .Include(c => c.UserB).ThenInclude(u => u.Profile).ThenInclude(p => p!.Degree)
            .Where(c => c.UserAId == me || c.UserBId == me)
            .OrderByDescending(c => c.LastMessageAt)
            .ToListAsync();
        var ids = convs.Select(c => c.Id).ToList();

        var lastMessages = await db.ChatMessages.AsNoTracking()
            .Where(m => ids.Contains(m.ConversationId))
            .GroupBy(m => m.ConversationId)
            .Select(g => g.OrderByDescending(m => m.CreatedAt).First())
            .ToDictionaryAsync(m => m.ConversationId);

        var unread = await db.ChatMessages.AsNoTracking()
            .Where(m => ids.Contains(m.ConversationId) && m.SenderId != null && m.SenderId != me)
            .Where(m => m.Conversation.UserAId == me
                ? m.Conversation.UserALastReadAt == null || m.CreatedAt > m.Conversation.UserALastReadAt
                : m.Conversation.UserBLastReadAt == null || m.CreatedAt > m.Conversation.UserBLastReadAt)
            .GroupBy(m => m.ConversationId)
            .Select(g => new { g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.Key, x => x.Count);

        return convs.Select(c => new ChatSummary(
            c.Id,
            chats.ToPerson(c.UserAId == me ? c.UserB : c.UserA),
            lastMessages.TryGetValue(c.Id, out var last) ? ChatService.ToDto(last, me) : null,
            unread.GetValueOrDefault(c.Id),
            c.LastMessageAt)).ToList();
    }

    /// <summary>
    /// Open the chat with a student (userId), a listing's owner (flatId, the "Message tenant" button), an
    /// item's seller (itemId, the "Message seller" button) or your Dcard match (drawId), optionally with a
    /// first message. Reuses the existing chat if there is one.
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<ChatSummary>> Start(StartChatRequest req)
    {
        var me = User.UserId();
        if (new object?[] { req.UserId, req.FlatId, req.ItemId, req.DrawId }.Count(x => x is not null) != 1)
            return Problem("Send exactly one of userId, flatId, itemId or drawId.", statusCode: StatusCodes.Status400BadRequest);

        FlatListing? flat = null;
        MarketItem? item = null;
        DailyDraw? draw = null;
        Guid otherId;
        if (req.FlatId is { } flatId)
        {
            flat = await db.FlatListings.AsNoTracking()
                .FirstOrDefaultAsync(f => f.Id == flatId && f.Status == ListingStatus.Active);
            if (flat is null) return NotFound();
            otherId = flat.OwnerId;
        }
        else if (req.ItemId is { } itemId)
        {
            item = await db.MarketItems.AsNoTracking().FirstOrDefaultAsync(i => i.Id == itemId);
            if (item is null) return NotFound();
            if (item.Availability == ItemAvailability.Sold)
                return Problem("This item has been sold.", statusCode: StatusCodes.Status409Conflict);
            otherId = item.SellerId;
        }
        else if (req.DrawId is { } drawId)
        {
            draw = await db.DailyDraws.AsNoTracking()
                .FirstOrDefaultAsync(d => d.Id == drawId && d.UserId == me && d.DrawnAt != null && d.MatchedUserId != null);
            if (draw is null) return NotFound();
            otherId = draw.MatchedUserId!.Value;
        }
        else
        {
            otherId = req.UserId!.Value;
            if (!await db.Profiles.AnyAsync(p => p.UserId == otherId)) return NotFound();
        }
        if (otherId == me)
            return Problem(flat is null && item is null ? "You can't message yourself." : "This is your listing.",
                statusCode: StatusCodes.Status400BadRequest);

        var (conv, created) = await chats.GetOrCreateAsync(me, otherId);
        var added = new List<ChatMessage>();
        if (flat is not null && await chats.AddAboutFlatAsync(conv, flat) is { } aboutFlat) added.Add(aboutFlat);
        if (item is not null && await chats.AddAboutItemAsync(conv, item) is { } aboutItem) added.Add(aboutItem);
        if (draw is not null)
        {
            // Both students' cards for the day; the About line points at the first student's (by id), so
            // it's the same whichever of them opens the chat
            var first = await db.DailyDraws.AsNoTracking()
                .Where(d => d.Day == draw.Day && d.UserId == conv.UserAId && d.MatchedUserId == conv.UserBId)
                .Select(d => (Guid?)d.Id)
                .FirstOrDefaultAsync() ?? draw.Id;
            if (await chats.AddAboutDailyCardAsync(conv, first, draw.Day) is { } aboutCard) added.Add(aboutCard);
        }
        if (!string.IsNullOrWhiteSpace(req.Text)) added.Add(chats.AddText(conv, me, req.Text));
        await db.SaveChangesAsync();
        await chats.NotifyAsync(conv, added);

        var summary = await Summary(conv.Id, me);
        return created ? CreatedAtAction(nameof(Messages), new { id = conv.Id }, summary) : summary;
    }

    /// <summary>Messages oldest → newest. Page back with before = the oldest createdAt you have.</summary>
    [HttpGet("{id:guid}/messages")]
    public async Task<ActionResult<List<ChatMessageDto>>> Messages(Guid id, [FromQuery] DateTimeOffset? before, [FromQuery] int limit = 50)
    {
        var me = User.UserId();
        if (!await db.Conversations.AnyAsync(c => c.Id == id && (c.UserAId == me || c.UserBId == me))) return NotFound();

        var q = db.ChatMessages.AsNoTracking().Where(m => m.ConversationId == id);
        if (before is not null) q = q.Where(m => m.CreatedAt < before);
        var page = await q.OrderByDescending(m => m.CreatedAt).Take(Math.Clamp(limit, 1, 200)).ToListAsync();
        return page.OrderBy(m => m.CreatedAt).Select(m => ChatService.ToDto(m, me)).ToList();
    }

    [HttpPost("{id:guid}/messages")]
    public async Task<ActionResult<ChatMessageDto>> Send(Guid id, SendMessageRequest req)
    {
        var me = User.UserId();
        var conv = await db.Conversations.FirstOrDefaultAsync(c => c.Id == id);
        if (conv is null || !conv.Has(me)) return NotFound();
        if (string.IsNullOrWhiteSpace(req.Text))
            return Problem("Message can't be empty.", statusCode: StatusCodes.Status400BadRequest);

        var m = chats.AddText(conv, me, req.Text);
        await db.SaveChangesAsync();
        await chats.NotifyAsync(conv, [m]);
        return ChatService.ToDto(m, me);
    }

    /// <summary>Mark the chat as read (clears its unread count).</summary>
    [HttpPost("{id:guid}/read")]
    public async Task<IActionResult> Read(Guid id)
    {
        var me = User.UserId();
        var conv = await db.Conversations.FirstOrDefaultAsync(c => c.Id == id);
        if (conv is null || !conv.Has(me)) return NotFound();
        var now = DateTimeOffset.UtcNow;
        conv.MarkRead(me, now);
        await db.SaveChangesAsync();
        await chats.NotifyReadAsync(conv, me, now);
        return NoContent();
    }

    private async Task<ChatSummary> Summary(Guid conversationId, Guid me) =>
        (await List()).First(c => c.Id == conversationId);
}
