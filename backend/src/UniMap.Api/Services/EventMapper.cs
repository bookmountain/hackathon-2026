using UniMap.Api.Contracts;
using UniMap.Api.Domain;

namespace UniMap.Api.Services;

/// <summary>An event with its headcount and the viewer's own status, as queried.</summary>
public record EventRow(MeetupEvent Event, int GoingCount, bool IsGoing);

public static class EventMapper
{
    /// <summary>Projects events with their headcount, without loading who's going.</summary>
    public static IQueryable<EventRow> WithCounts(this IQueryable<MeetupEvent> q, Guid viewerId) =>
        q.Select(e => new EventRow(e, e.Attendees.Count, e.Attendees.Any(a => a.UserId == viewerId)));

    public static EventSummary ToSummary(EventRow row, Guid viewerId, DateTimeOffset now)
    {
        var e = row.Event;
        var start = AdelaideTime.Local(e.StartsAt);
        DateTime? end = e.EndsAt is { } t ? AdelaideTime.Local(t) : null;
        var over = MeetupCatalog.EndOf(e) <= now;
        return new EventSummary(
            e.Id, e.Title, e.Type, e.StartsAt, e.EndsAt,
            AdelaideTime.Weekday(start).ToUpperInvariant(),
            start.Day.ToString(),
            AdelaideTime.Time(start),
            $"{AdelaideTime.Date(start)} · {AdelaideTime.TimeRange(start, end)}",
            Place(e),
            e.Capacity, row.GoingCount, row.GoingCount >= e.Capacity, e.WalkInsWelcome,
            row.IsGoing, e.HostId == viewerId,
            e.StartsAt <= now && !over, over,
            e.CreatedAt);
    }

    public static EventDetail ToDetail(EventRow row, Guid viewerId, DateTimeOffset now) =>
        new(ToSummary(row, viewerId, now), row.Event.Description);

    private static EventPlace Place(MeetupEvent e)
    {
        if (e.PlaceId is { } id && PickupPoints.Find(id) is { } p)
            return new EventPlace(p.Id, e.PlaceName ?? p.Name, p.Note, p.Lat, p.Lng);
        return new EventPlace(null, e.PlaceName ?? MeetupCatalog.PinnedLocation, null, e.Location.Y, e.Location.X);
    }
}
