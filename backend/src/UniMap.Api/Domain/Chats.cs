namespace UniMap.Api.Domain;

public enum ChatMessageKind { Text, About }

/// <summary>What an "About" message refers to. Meetups can be added later.</summary>
public enum ChatAboutType { Flat, Item }

/// <summary>
/// One chat per pair of students (like the UCompass prototype). UserAId is always the smaller id,
/// so each pair has exactly one row.
/// </summary>
public class Conversation
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid UserAId { get; set; }
    public User UserA { get; set; } = null!;
    public Guid UserBId { get; set; }
    public User UserB { get; set; } = null!;
    public DateTimeOffset? UserALastReadAt { get; set; }
    public DateTimeOffset? UserBLastReadAt { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset LastMessageAt { get; set; } = DateTimeOffset.UtcNow;

    public static (Guid A, Guid B) Order(Guid x, Guid y) => x.CompareTo(y) < 0 ? (x, y) : (y, x);

    public bool Has(Guid userId) => UserAId == userId || UserBId == userId;
    public Guid OtherThan(Guid userId) => UserAId == userId ? UserBId : UserAId;
    public DateTimeOffset? LastReadBy(Guid userId) => UserAId == userId ? UserALastReadAt : UserBLastReadAt;

    public void MarkRead(Guid userId, DateTimeOffset at)
    {
        if (UserAId == userId) UserALastReadAt = at;
        else UserBLastReadAt = at;
    }
}

public class ChatMessage
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid ConversationId { get; set; }
    public Conversation Conversation { get; set; } = null!;
    /// <summary>Null for "About" messages, which the app adds itself.</summary>
    public Guid? SenderId { get; set; }
    public ChatMessageKind Kind { get; set; }
    /// <summary>Text, or for "About" messages the label shown, e.g. "About: Sunny room · $245/wk" or
    /// "About: LED desk lamp (USB) · $12".</summary>
    public required string Body { get; set; }
    public ChatAboutType? AboutType { get; set; }
    public Guid? AboutId { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
}
