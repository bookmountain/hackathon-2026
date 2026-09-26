using UniMap.Api.Domain;

namespace UniMap.Api.Contracts;

/// <summary>Today's Dcard, for the "Daily card" screen.</summary>
/// <param name="Status">Ready ("Draw a card"), Matched ("Your card today") or Locked ("Deck locked").</param>
/// <param name="Day">Today in Adelaide.</param>
/// <param name="DrawnToday">"{n} students have drawn today".</param>
/// <param name="ResetsAt">Next Adelaide midnight: the "Deck resets in", "Next draw in" and "Unlocks in" clocks.</param>
/// <param name="MissedDay">With Ready: you didn't draw yesterday, so pressing Draw locks the deck until
/// resetsAt instead of dealing a card, and you can draw again from then.</param>
/// <param name="DrawId">With Matched: send it as drawId on POST /api/chats ("Send a message to {nick}").</param>
/// <param name="Match">With Matched: the student you drew (nickname, major, uni, avatar). Null if they've since
/// deleted their account.</param>
/// <param name="DrawnAt">When you pressed Draw today.</param>
public record DailyCardResponse(
    DrawStatus Status,
    DateOnly Day,
    int DrawnToday,
    DateTimeOffset ResetsAt,
    bool MissedDay,
    Guid? DrawId,
    ChatPerson? Match,
    DateTimeOffset? DrawnAt);
