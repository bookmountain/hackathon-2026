using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using UniMap.Api.Data;
using UniMap.Api.Services;

namespace UniMap.Api.Hubs;

/// <summary>
/// Real-time chat events. Connect to /hubs/chat with ?access_token={jwt}.
/// Server → client events: "message" (ChatMessageDto), "read" ({conversationId, userId, at}),
/// "typing" ({conversationId, userId}). Messages are sent with POST /api/chats/{id}/messages.
/// </summary>
[Authorize]
public class ChatHub(AppDbContext db) : Hub
{
    /// <summary>Tell the other person you're typing (the prototype's "•••").</summary>
    public async Task Typing(Guid conversationId)
    {
        var me = Context.User!.UserId();
        var conv = await db.Conversations.AsNoTracking().FirstOrDefaultAsync(c => c.Id == conversationId);
        if (conv is null || !conv.Has(me)) return;
        await Clients.User(conv.OtherThan(me).ToString()).SendAsync("typing", new { conversationId, userId = me });
    }
}

/// <summary>SignalR addresses users by the JWT "sub" claim (our user id).</summary>
public class SubUserIdProvider : IUserIdProvider
{
    public string? GetUserId(HubConnectionContext connection) => connection.User?.FindFirst("sub")?.Value;
}
