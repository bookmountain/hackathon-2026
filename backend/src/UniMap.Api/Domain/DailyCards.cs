namespace UniMap.Api.Domain;

/// <summary>What the Daily card screen shows today.</summary>
public enum DrawStatus
{
    /// <summary>"Draw a card". Check missedDay: drawing after a missed day locks the deck until midnight.</summary>
    Ready,
    /// <summary>"Your card today": you've drawn and been matched.</summary>
    Matched,
    /// <summary>"Deck locked": you pressed Draw after missing a day. A new session starts at midnight.</summary>
    Missed,
}

/// <summary>
/// One student's daily card for one Adelaide day: one row per student per day. Draws are mutual:
/// drawing someone writes a row for both of you. The other student's row has no <see cref="DrawnAt"/> until
/// they draw too, which reveals you as their card.
/// </summary>
public class DailyDraw
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;

    /// <summary>Adelaide calendar date. The deck resets at Adelaide midnight.</summary>
    public DateOnly Day { get; set; }

    /// <summary>
    /// Who you're matched with. Null when <see cref="SessionRestart"/> is set, or when the other student has
    /// since deleted their account.
    /// </summary>
    public Guid? MatchedUserId { get; set; }
    public User? MatchedUser { get; set; }

    /// <summary>When you pressed Draw. Null: the other student drew you, and your card is hidden until you draw.</summary>
    public DateTimeOffset? DrawnAt { get; set; }

    /// <summary>
    /// You pressed Draw after missing a day. Nobody is matched: the deck stays locked until midnight, and
    /// counts as today's draw, so you can draw again tomorrow.
    /// </summary>
    public bool SessionRestart { get; set; }

    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
}

public static class DailyCardRules
{
    /// <summary>
    /// You can draw on <paramref name="day"/> if you've never drawn, or pressed Draw yesterday (drew a card or
    /// started a new session). Otherwise you missed a day.
    /// </summary>
    /// <param name="lastPressed">The last day before <paramref name="day"/> on which you pressed Draw.</param>
    public static bool CanDraw(DateOnly? lastPressed, DateOnly day) =>
        lastPressed is null || lastPressed == day.AddDays(-1);

    /// <summary>The next Adelaide midnight, when the deck resets (and a missed-day lock ends).</summary>
    public static DateTimeOffset NextChangeAt(DateOnly day) => AdelaideTime.ToUtc(day.AddDays(1), TimeOnly.MinValue);
}
