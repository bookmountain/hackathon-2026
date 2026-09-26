using System.ComponentModel.DataAnnotations;
using UniMap.Api.Domain;

namespace UniMap.Api.Contracts;

/// <summary>What another student sees of you in chat: nickname, major, uni, avatar. Never email.</summary>
/// <param name="AvatarPreset">Preset avatar colour, 0–7, or null. Shown when there's no photo.</param>
public record ChatPerson(Guid UserId, string DisplayName, string? Major, University University, string? AvatarUrl, int? AvatarPreset);

public record ChatAbout(ChatAboutType Type, Guid Id);

public record ChatMessageDto(
    Guid Id,
    Guid ConversationId,
    Guid? SenderId,
    bool IsMine,
    ChatMessageKind Kind,
    string Body,
    ChatAbout? About,
    DateTimeOffset CreatedAt);

public record ChatSummary(
    Guid Id,
    ChatPerson Other,
    ChatMessageDto? LastMessage,
    int UnreadCount,
    DateTimeOffset LastMessageAt);

/// <summary>Open (or reuse) the chat with another student. Send exactly one of userId, flatId, itemId or drawId.</summary>
/// <param name="UserId">Chat with this student (e.g. from a person pin on the map).</param>
/// <param name="FlatId">Or: chat with this listing's owner ("Message tenant"). Adds an "About" line.</param>
/// <param name="ItemId">Or: chat with this item's seller ("Message seller"). Adds an "About" line.</param>
/// <param name="DrawId">Or: chat with the student on your Dcard ("Send a message to {nick}"), using drawId from
/// GET /api/draw/today. Adds a "Daily card match · 27 Sep" line.</param>
/// <param name="Text">Optional first message, e.g. "Is it still available?".</param>
public record StartChatRequest(Guid? UserId, Guid? FlatId, Guid? ItemId, Guid? DrawId, [MaxLength(2000)] string? Text);

public record SendMessageRequest([Required, MaxLength(2000)] string Text);
