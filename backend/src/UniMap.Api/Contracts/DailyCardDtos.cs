using UniMap.Api.Domain;

namespace UniMap.Api.Contracts;

/// <summary>Today's Dcard, for the "Daily card" screen.</summary>
/// <param name="Status">Ready ("Draw your card"), Matched ("Your card today") or Missed ("Deck locked").</param>
/// <param name="Match">With Matched: the student you drew (nickname, major, uni, avatar). Null if they've since
/// deleted their account.</param>
/// <param name="DrawnToday">"{n} students have drawn today".</param>
/// <param name="NextChangeAt">Next Adelaide midnight: the "Deck resets in", "Next draw in" and "Unlocks in"
/// clocks.</param>
/// <param name="MissedDay">With Ready: you didn't draw yesterday, so pressing Draw locks the deck until
/// nextChangeAt (status Missed) instead of dealing a card. You can draw again from then.</param>
/// <param name="DrawId">With Matched: send it as drawId on POST /api/chats ("Send a message to {nick}").</param>
/// <param name="CanReset">Demo server: POST /api/daily-card/reset works, so the app can show its demo buttons.</param>
/// <param name="Details">With Matched: more about the student you drew, for the card.</param>
public record DailyCardResponse(
    DrawStatus Status,
    ChatPerson? Match,
    int DrawnToday,
    DateTimeOffset NextChangeAt,
    bool MissedDay,
    Guid? DrawId,
    bool CanReset,
    MatchDetails? Details = null);

/// <summary>
/// The rest of your daily match's card: only your Dcard match sees these, not everyone on the map.
/// </summary>
/// <param name="Pronouns">e.g. "she/her"; null if not set.</param>
/// <param name="YearOfStudy">1 = first year; null if not set.</param>
/// <param name="Bio">Their short bio; null if not set.</param>
/// <param name="Interests">Interest tags, e.g. "board-games".</param>
/// <param name="SharedInterests">The ones you have too ("You both like…").</param>
public record MatchDetails(
    string? Pronouns,
    int? YearOfStudy,
    string? Bio,
    IReadOnlyList<string> Interests,
    IReadOnlyList<string> SharedInterests);
