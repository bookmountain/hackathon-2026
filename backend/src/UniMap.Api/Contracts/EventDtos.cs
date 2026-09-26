using System.ComponentModel.DataAnnotations;
using UniMap.Api.Domain;

namespace UniMap.Api.Contracts;

/// <summary>Where the event is.</summary>
/// <param name="PlaceId">One of the preset places (the safe pickup points), or null for a pin the host dropped.</param>
/// <param name="Name">Ready to show, e.g. "Barr Smith Library, Level 2", "Rymill Park lake" or "Pinned location".</param>
/// <param name="Note">Preset places only, e.g. "Main entrance, Adelaide Uni".</param>
/// <param name="Lat">Exact, so people can find it. Nothing links the spot to the host.</param>
public record EventPlace(string? PlaceId, string Name, string? Note, double Lat, double Lng);

/// <summary>
/// Map pin / list card. Never says who hosts or who's going: only the headcount, and whether you yourself
/// are hosting or going.
/// </summary>
/// <param name="StartsAt">UTC. The labels below are already in Adelaide time.</param>
/// <param name="EndsAt">Optional. Without one, the event is hidden 2 hours after it starts.</param>
/// <param name="DayLabel">For the list card's date badge, e.g. "TUE".</param>
/// <param name="DateLabel">Day of the month for the date badge, e.g. "29".</param>
/// <param name="TimeLabel">Start time for the list card, e.g. "7:00 pm".</param>
/// <param name="WhenLabel">For the detail page, e.g. "Tue 29 Sep · 7:00–9:30 pm".</param>
/// <param name="GoingCount">Includes the host. The only thing shown about who's going.</param>
/// <param name="IsFull">GoingCount has reached capacity, so Join is refused.</param>
/// <param name="WalkInsWelcome">"Walk-ins welcome · No RSVP needed to turn up".</param>
/// <param name="IsGoing">You've joined: show "Going ✓".</param>
/// <param name="IsHost">You host it: you can edit or cancel it. Nobody else is ever told who hosts.</param>
/// <param name="IsHappeningNow">It has started and hasn't ended.</param>
/// <param name="IsOver">It has ended. Only seen in "mine" or when opening an old link; searches hide these.</param>
public record EventSummary(
    Guid Id,
    string Title,
    EventType Type,
    DateTimeOffset StartsAt,
    DateTimeOffset? EndsAt,
    string DayLabel,
    string DateLabel,
    string TimeLabel,
    string WhenLabel,
    EventPlace Place,
    int Capacity,
    int GoingCount,
    bool IsFull,
    bool WalkInsWelcome,
    bool IsGoing,
    bool IsHost,
    bool IsHappeningNow,
    bool IsOver,
    DateTimeOffset CreatedAt);

/// <summary>Event detail page. The host shows as "Hosted anonymously · Verified student host".</summary>
public record EventDetail(EventSummary Summary, string? Description);

/// <param name="Type">Study, Casual, Social or Food.</param>
/// <param name="StartsAt">In the future (up to 180 days ahead), with a UTC offset, e.g. "2026-09-29T19:00:00+09:30".
/// The prototype's datetime-local input has no offset, so convert it first.</param>
/// <param name="EndsAt">Optional, after startsAt and at most 12 hours later.</param>
/// <param name="PlaceId">A preset place from GET /api/events/options. Or leave null and send lat/lng for "Drop a pin
/// on the map".</param>
/// <param name="PlaceName">With a preset place: optional detail that replaces its name, e.g. "Barr Smith Library,
/// Level 2". With a pin: "Name this spot", e.g. "Rymill Park lake" (defaults to "Pinned location").</param>
/// <param name="Lat">Your pin, in greater Adelaide. Only when placeId is null.</param>
/// <param name="Capacity">4 to 60 (the slider). Default 20. Can't go below the number already going.</param>
/// <param name="WalkInsWelcome">Defaults to true.</param>
public record UpsertEventRequest(
    [Required, MaxLength(80)] string Title,
    [Required] EventType? Type,
    [Required] DateTimeOffset? StartsAt,
    DateTimeOffset? EndsAt,
    [MaxLength(1000)] string? Description,
    string? PlaceId,
    [MaxLength(64)] string? PlaceName,
    [Range(-35.4, -34.5)] double? Lat,
    [Range(138.3, 139.0)] double? Lng,
    [Range(MeetupCatalog.MinCapacity, MeetupCatalog.MaxCapacity)] int? Capacity,
    bool? WalkInsWelcome);

/// <param name="Places">The preset places for "Where": the three safe pickup points.</param>
/// <param name="DefaultCapacity">Where the Host form's slider starts.</param>
public record EventOptionsResponse(
    IEnumerable<LabeledOption<EventType>> Types,
    IEnumerable<PickupPoint> Places,
    int MinCapacity,
    int MaxCapacity,
    int DefaultCapacity);
