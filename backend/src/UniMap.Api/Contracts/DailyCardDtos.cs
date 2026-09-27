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
public record DailyCardResponse(
    DrawStatus Status,
    ChatPerson? Match,
    int DrawnToday,
    DateTimeOffset NextChangeAt,
    bool MissedDay,
    Guid? DrawId);
