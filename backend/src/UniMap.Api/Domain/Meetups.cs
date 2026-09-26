using NetTopologySuite.Geometries;

namespace UniMap.Api.Domain;

/// <summary>The "Type" control on the Host form.</summary>
public enum EventType { Study, Casual, Social, Food }

/// <summary>
/// A walk-in meetup (the "Meetups" tab). Hosts and guests are anonymous: the API never returns who hosts
/// an event or who's going, only the headcount and whether you yourself are hosting or going.
/// </summary>
public class MeetupEvent
{
    public Guid Id { get; set; } = Guid.NewGuid();
    /// <summary>Only used to let the host edit or cancel. Never returned to anyone.</summary>
    public Guid HostId { get; set; }
    public User Host { get; set; } = null!;

    public required string Title { get; set; }
    public string? Description { get; set; }
    public EventType Type { get; set; }
    public DateTimeOffset StartsAt { get; set; }
    /// <summary>Optional, e.g. the 9:30 pm in "7:00–9:30 pm".</summary>
    public DateTimeOffset? EndsAt { get; set; }

    /// <summary>One of <see cref="PickupPoints"/>, or null when the host dropped a pin.</summary>
    public string? PlaceId { get; set; }
    /// <summary>
    /// What to call the spot, e.g. "Barr Smith Library, Level 2" or "Rymill Park lake". With a preset place
    /// it's optional and defaults to the preset's name.
    /// </summary>
    public string? PlaceName { get; set; }
    /// <summary>The preset place's location, or the host's pin. WGS84 (SRID 4326), stored as PostGIS geography.</summary>
    public required Point Location { get; set; }

    public int Capacity { get; set; }
    /// <summary>"Walk-ins welcome · No RSVP needed to turn up". On by default.</summary>
    public bool WalkInsWelcome { get; set; } = true;

    public List<EventAttendee> Attendees { get; set; } = [];

    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;
}

/// <summary>Someone going to an event. Only ever counted, never listed.</summary>
public class EventAttendee
{
    public Guid EventId { get; set; }
    public MeetupEvent Event { get; set; } = null!;
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;
    public DateTimeOffset JoinedAt { get; set; } = DateTimeOffset.UtcNow;
}

public static class MeetupCatalog
{
    /// <summary>The Host form's capacity slider.</summary>
    public const int MinCapacity = 4, MaxCapacity = 60, DefaultCapacity = 20;

    /// <summary>An event with no end time counts as over this long after it starts.</summary>
    public static readonly TimeSpan DefaultLength = TimeSpan.FromHours(2);

    /// <summary>Longest an event can run, and how far ahead it can be hosted.</summary>
    public static readonly TimeSpan MaxLength = TimeSpan.FromHours(12), MaxAhead = TimeSpan.FromDays(180);

    /// <summary>Name of a dropped pin the host didn't name (as in the prototype).</summary>
    public const string PinnedLocation = "Pinned location";

    public static DateTimeOffset EndOf(MeetupEvent e) => e.EndsAt ?? e.StartsAt + DefaultLength;
}

/// <summary>Adelaide local time, for event labels and seed dates.</summary>
public static class AdelaideTime
{
    /// <summary>
    /// Australia/Adelaide from the OS, or the same rules built in (UTC+9:30, +10:30 from the first Sunday
    /// in October to the first Sunday in April) on images without tzdata.
    /// </summary>
    public static readonly TimeZoneInfo Zone = Load();

    private static TimeZoneInfo Load()
    {
        try { return TimeZoneInfo.FindSystemTimeZoneById("Australia/Adelaide"); }
        catch (Exception e) when (e is TimeZoneNotFoundException or InvalidTimeZoneException)
        {
            var dst = TimeZoneInfo.AdjustmentRule.CreateAdjustmentRule(
                DateTime.MinValue.Date, DateTime.MaxValue.Date, TimeSpan.FromHours(1),
                TimeZoneInfo.TransitionTime.CreateFloatingDateRule(new DateTime(1, 1, 1, 2, 0, 0), 10, 1, DayOfWeek.Sunday),
                TimeZoneInfo.TransitionTime.CreateFloatingDateRule(new DateTime(1, 1, 1, 3, 0, 0), 4, 1, DayOfWeek.Sunday));
            return TimeZoneInfo.CreateCustomTimeZone("Australia/Adelaide", TimeSpan.FromHours(9.5),
                "Adelaide", "ACST", "ACDT", [dst]);
        }
    }

    private static readonly string[] Days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    private static readonly string[] Months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    public static DateTime Local(DateTimeOffset t) => TimeZoneInfo.ConvertTime(t, Zone).DateTime;

    public static DateTimeOffset ToUtc(DateOnly date, TimeOnly time)
    {
        var local = date.ToDateTime(time, DateTimeKind.Unspecified);
        return new DateTimeOffset(local, Zone.GetUtcOffset(local)).ToUniversalTime();
    }

    public static DateOnly Today() => DateOnly.FromDateTime(Local(DateTimeOffset.UtcNow));

    /// <summary>"Tue".</summary>
    public static string Weekday(DateTime local) => Days[(int)local.DayOfWeek];

    /// <summary>"Tue 29 Sep".</summary>
    public static string Date(DateTime local) => $"{Weekday(local)} {local.Day} {Months[local.Month - 1]}";

    /// <summary>"7:00 pm", "9:30 am".</summary>
    public static string Time(DateTime local) => $"{Clock(local)} {(local.Hour < 12 ? "am" : "pm")}";

    /// <summary>"7:00–9:30 pm", "11:00 am–1:00 pm", or just "7:00 pm" with no end.</summary>
    public static string TimeRange(DateTime start, DateTime? end)
    {
        if (end is not { } e) return Time(start);
        var sameHalf = (start.Hour < 12) == (e.Hour < 12) && start.Date == e.Date;
        return $"{(sameHalf ? Clock(start) : Time(start))}–{Time(e)}";
    }

    private static string Clock(DateTime local) => $"{(local.Hour % 12 == 0 ? 12 : local.Hour % 12)}:{local.Minute:00}";
}
