using System.ComponentModel.DataAnnotations;
using UniMap.Api.Domain;

namespace UniMap.Api.Contracts;

/// <summary>What another student sees of you in chat: nickname, major, uni, avatar. Never email.</summary>
public record ChatPerson(Guid UserId, string DisplayName, string? Major, University University, string? AvatarUrl);

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

/// <summary>Open (or reuse) the chat with another student.</summary>
/// <param name="UserId">Chat with this student (e.g. from a person pin on the map).</param>
/// <param name="FlatId">Or: chat with this listing's owner ("Message tenant"). Adds an "About" line.</param>
/// <param name="Text">Optional first message, e.g. "Is it still available?".</param>
public record StartChatRequest(Guid? UserId, Guid? FlatId, [MaxLength(2000)] string? Text);

public record SendMessageRequest([Required, MaxLength(2000)] string Text);
