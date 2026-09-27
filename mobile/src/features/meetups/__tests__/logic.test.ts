import { EVENT } from "@/test/fixtures";
import {
  calendarEntry,
  countMeetupFilters,
  EMPTY_EVENT,
  EMPTY_MEETUP_FILTERS,
  eventProblem,
  eventRequest,
  fillPercent,
  filterEvents,
  joinLabel,
  levelTags,
} from "../logic";

const now = new Date(2026, 8, 26, 16, 0); // Sat 26 Sep 2026, 4pm
const later = new Date(2026, 8, 29, 19, 0);

describe("headcount", () => {
  it("fills the bar from the API's count", () => {
    expect(fillPercent(EVENT)).toBe(50);
  });

  it("labels the Join toggle", () => {
    expect(joinLabel(EVENT)).toBe("Join");
    expect(joinLabel({ ...EVENT, joined: true })).toBe("Going ✓");
    expect(joinLabel({ ...EVENT, full: true })).toBe("Full");
    expect(joinLabel({ ...EVENT, full: true, joined: true })).toBe("Going ✓");
    expect(joinLabel({ ...EVENT, host: true, joined: true })).toBe("Hosting");
  });
});

describe("eventProblem", () => {
  it("needs a name, a future time, and a pin for custom places", () => {
    expect(eventProblem(EMPTY_EVENT, now)).toBe("Give your event a name");
    expect(eventProblem({ ...EMPTY_EVENT, title: "Coffee" }, now)).toBe("Pick a date & time");
    expect(eventProblem({ ...EMPTY_EVENT, title: "Coffee", when: new Date(2026, 8, 26, 9) }, now)).toBe("Pick a time in the future");
    expect(eventProblem({ ...EMPTY_EVENT, title: "Coffee", when: later, where: "custom" }, now)).toBe("Pin the location on the map");
    expect(eventProblem({ ...EMPTY_EVENT, title: "Coffee", when: later }, now)).toBeNull();
  });
});

describe("eventRequest", () => {
  it("sends a preset place by id and the start as an instant", () => {
    expect(eventRequest({ ...EMPTY_EVENT, title: " Coffee & code ", when: later })).toEqual({
      title: "Coffee & code",
      type: "Study",
      startsAt: later.toISOString(),
      endsAt: null,
      description: null,
      placeId: "barr-smith-library",
      placeName: null,
      lat: null,
      lng: null,
      capacity: 20,
      walkInsWelcome: true,
    });
  });

  it("sends a dropped pin with its name", () => {
    const body = eventRequest({
      ...EMPTY_EVENT,
      title: "Picnic",
      when: later,
      where: "custom",
      pin: { latitude: -34.9235, longitude: 138.6155 },
      place: "Rymill Park",
      walkIn: false,
    });
    expect(body).toMatchObject({ placeId: null, placeName: "Rymill Park", lat: -34.9235, lng: 138.6155, walkInsWelcome: false });
  });

  it("keeps an edited event's length and its preset place's name", () => {
    const start = new Date("2026-10-01T09:30:00Z");
    const kept = { startsAt: start.toISOString(), endsAt: "2026-10-01T12:00:00Z", placeId: "barr-smith-library", placeName: "Barr Smith, Level 2" };
    const moved = new Date("2026-10-02T09:30:00Z");
    expect(eventRequest({ ...EMPTY_EVENT, title: "Revision", when: moved, kept })).toMatchObject({
      endsAt: "2026-10-02T12:00:00.000Z",
      placeName: "Barr Smith, Level 2",
    });
    // Moved to another place: that place's own name
    expect(eventRequest({ ...EMPTY_EVENT, title: "Revision", when: moved, where: "hub-central", kept }).placeName).toBeNull();
  });
});

describe("calendarEntry", () => {
  it("runs two hours when the event has no end, and adds the description", () => {
    const start = "2026-09-29T09:30:00Z";
    const entry = calendarEntry({ ...EVENT, startsAt: start, endsAt: null }, "Bring snacks");
    expect(entry.title).toBe(`${EVENT.title} · UCompass`);
    expect(entry.location).toBe(`${EVENT.where.name}, Adelaide SA`);
    expect(entry.details).toBe("Bring snacks\n\nWalk-in welcome. Host & guests stay anonymous on UCompass.");
    expect(entry.end!.getTime() - entry.start.getTime()).toBe(2 * 60 * 60 * 1000);
  });

  it("uses the event's own end time", () => {
    const entry = calendarEntry({ ...EVENT, startsAt: "2026-09-29T09:30:00Z", endsAt: "2026-09-29T10:00:00Z" });
    expect(entry.end!.toISOString()).toBe("2026-09-29T10:00:00.000Z");
    expect(entry.details).toBe("Walk-in welcome. Host & guests stay anonymous on UCompass.");
    expect(entry.alarms).toBeUndefined();
  });

  it("carries the reminders as .ics alarms", () => {
    expect(calendarEntry(EVENT, "", ["P2D", "P1D"]).alarms).toEqual(["P2D", "P1D"]);
  });
});

describe("levelTags", () => {
  it("says all study levels when the event has none or includes Everyone", () => {
    expect(levelTags(EVENT)).toEqual(["All study levels"]);
    expect(levelTags({ ...EVENT, levels: [] })).toEqual(["All study levels"]);
    expect(levelTags({ ...EVENT, levels: ["Everyone"] })).toEqual(["All study levels"]);
  });

  it("lists the chosen levels", () => {
    expect(levelTags({ ...EVENT, levels: ["Postgrad", "PhD"] })).toEqual(["Postgrad", "PhD"]);
  });
});

describe("filterEvents", () => {
  // Tuesday 29 Sep 2026, 10am on the phone's clock
  const now = new Date(2026, 8, 29, 10, 0);
  const at = (day: number, hour: number) => new Date(2026, 8, day, hour).toISOString();
  const events = [
    { ...EVENT, id: "today", cat: "Study" as const, startsAt: at(29, 18) },
    { ...EVENT, id: "saturday", cat: "Social" as const, startsAt: at(33, 11), walkIns: false },
    { ...EVENT, id: "monday", cat: "Food" as const, startsAt: at(35, 12), full: true },
    { ...EVENT, id: "nextWeek", cat: "Casual" as const, startsAt: at(37, 12) },
  ];
  const ids = (list: { id: string }[]) => list.map((e) => e.id);

  it("returns everything with no filters", () => {
    expect(ids(filterEvents(events, EMPTY_MEETUP_FILTERS, now))).toEqual(["today", "saturday", "monday", "nextWeek"]);
    expect(countMeetupFilters(EMPTY_MEETUP_FILTERS)).toBe(0);
  });

  it("narrows by when", () => {
    expect(ids(filterEvents(events, { ...EMPTY_MEETUP_FILTERS, when: "today" }, now))).toEqual(["today"]);
    expect(ids(filterEvents(events, { ...EMPTY_MEETUP_FILTERS, when: "weekend" }, now))).toEqual(["saturday"]);
    expect(ids(filterEvents(events, { ...EMPTY_MEETUP_FILTERS, when: "week" }, now))).toEqual(["today", "saturday", "monday"]);
  });

  it("counts this weekend from today when it's already the weekend", () => {
    const sunday = new Date(2026, 9, 4, 9, 0);
    const sundayEvent = { ...EVENT, id: "sunday", startsAt: new Date(2026, 9, 4, 15).toISOString() };
    expect(ids(filterEvents([sundayEvent], { ...EMPTY_MEETUP_FILTERS, when: "weekend" }, sunday))).toEqual(["sunday"]);
  });

  it("matches any picked category, walk-ins and free spots", () => {
    expect(ids(filterEvents(events, { ...EMPTY_MEETUP_FILTERS, categories: ["Social", "Food"] }, now))).toEqual([
      "saturday",
      "monday",
    ]);
    expect(ids(filterEvents(events, { ...EMPTY_MEETUP_FILTERS, walkInsOnly: true, spotsLeft: true }, now))).toEqual([
      "today",
      "nextWeek",
    ]);
    expect(countMeetupFilters({ categories: ["Study"], when: "week", walkInsOnly: true, spotsLeft: false })).toBe(3);
  });
});
