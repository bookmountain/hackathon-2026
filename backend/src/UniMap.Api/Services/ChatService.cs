using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using UniMap.Api.Contracts;
using UniMap.Api.Data;
using UniMap.Api.Domain;
using UniMap.Api.Hubs;

namespace UniMap.Api.Services;

public class ChatService(AppDbContext db, StorageService storage, IHubContext<ChatHub> hub)
{
    public async Task<(Conversation Conversation, bool Created)> GetOrCreateAsync(Guid me, Guid other)
    {
        var (a, b) = Conversation.Order(me, other);
        var conv = await db.Conversations.FirstOrDefaultAsync(c => c.UserAId == a && c.UserBId == b);
        if (conv is not null) return (conv, false);
        conv = new Conversation { UserAId = a, UserBId = b };
        db.Conversations.Add(conv);
        return (conv, true);
    }

    /// <summary>Adds the "About: …" line unless the chat is already about this listing.</summary>
    public async Task<ChatMessage?> AddAboutFlatAsync(Conversation conv, FlatListing flat)
    {
        var lastAbout = await db.ChatMessages.AsNoTracking()
            .Where(m => m.ConversationId == conv.Id && m.Kind == ChatMessageKind.About)
            .OrderByDescending(m => m.CreatedAt).FirstOrDefaultAsync();
        if (lastAbout is { AboutType: ChatAboutType.Flat } && lastAbout.AboutId == flat.Id) return null;

        return Add(conv, new ChatMessage
        {
            ConversationId = conv.Id,
            Kind = ChatMessageKind.About,
            Body = $"About: {flat.Title} · ${flat.RentPerWeek}/wk",
            AboutType = ChatAboutType.Flat,
            AboutId = flat.Id,
        });
    }

    public ChatMessage AddText(Conversation conv, Guid sender, string text)
    {
        var m = Add(conv, new ChatMessage { ConversationId = conv.Id, SenderId = sender, Kind = ChatMessageKind.Text, Body = text.Trim() });
        conv.MarkRead(sender, m.CreatedAt); // your own message doesn't count as unread
        return m;
    }

    private ChatMessage Add(Conversation conv, ChatMessage m)
    {
        db.ChatMessages.Add(m);
        conv.LastMessageAt = m.CreatedAt;
        return m;
    }

    /// <summary>Push new messages to both people (after SaveChanges). Each gets their own IsMine.</summary>
    public async Task NotifyAsync(Conversation conv, IEnumerable<ChatMessage> messages)
    {
        foreach (var m in messages)
            foreach (var userId in new[] { conv.UserAId, conv.UserBId })
                await hub.Clients.User(userId.ToString()).SendAsync("message", ToDto(m, userId));
    }

    public Task NotifyReadAsync(Conversation conv, Guid reader, DateTimeOffset at) =>
        hub.Clients.User(conv.OtherThan(reader).ToString())
            .SendAsync("read", new { conversationId = conv.Id, userId = reader, at });

    public static ChatMessageDto ToDto(ChatMessage m, Guid viewer) => new(
        m.Id, m.ConversationId, m.SenderId, m.SenderId == viewer, m.Kind, m.Body,
        m.AboutType is { } t && m.AboutId is { } id ? new ChatAbout(t, id) : null,
        m.CreatedAt);

    /// <summary>Needs Profile and Profile.Degree loaded.</summary>
    public ChatPerson ToPerson(User u) => new(
        u.Id, u.Profile?.DisplayName ?? "Student", u.Profile?.Degree?.Name ?? u.Profile?.Department,
        u.University, storage.ReadUrl(u.Profile?.AvatarKey));
}
