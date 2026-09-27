import type { EventRequest } from "@/api/types";
import type { EventCategory, MapPoint, MeetupEvent } from "@/data/types";
import type { CalendarEvent } from "@/lib/calendar";

export const EVENT_CATEGORIES: EventCategory[] = ["Study", "Social", "Casual", "Food"];

/** Chips over the meetups map */
export type MeetupWhen = "any" | "today" | "weekend" | "week";

export const WHEN_OPTIONS: { label: string; value: MeetupWhen }[] = [
  { label: "Any time", value: "any" },
  { label: "Today", value: "today" },
  { label: "This weekend", value: "weekend" },
  { label: "Next 7 days", value: "week" },
];

/** The Filters dialog; no categories = all of them */
export type MeetupFilters = { categories: EventCategory[]; when: MeetupWhen; walkInsOnly: boolean; spotsLeft: boolean };

export const EMPTY_MEETUP_FILTERS: MeetupFilters = { categories: [], when: "any", walkInsOnly: false, spotsLeft: false };

const DAY_MS = 24 * 60 * 60 * 1000;

/** [start, end) of a "when" choice on the phone's clock */
function whenRange(when: MeetupWhen, now: Date): [number, number] | null {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const day = (n: number) => new Date(today.getFullYear(), today.getMonth(), today.getDate() + n).getTime();
  switch (when) {
    case "any":
      return null;
    case "today":
      return [today.getTime(), day(1)];
    case "week":
      return [today.getTime(), now.getTime() + 7 * DAY_MS];
    case "weekend": {
      const weekday = today.getDay(); // 0 = Sunday, 6 = Saturday
      if (weekday === 0) return [today.getTime(), day(1)];
      if (weekday === 6) return [today.getTime(), day(2)];
      return [day(6 - weekday), day(8 - weekday)];
    }
  }
}

/** Events matching every filter */
export function filterEvents(events: MeetupEvent[], f: MeetupFilters, now: Date = new Date()): MeetupEvent[] {
  const range = whenRange(f.when, now);
  return events.filter((e) => {
    const start = new Date(e.startsAt).getTime();
    return (
      (!f.categories.length || f.categories.includes(e.cat)) &&
      (!range || (start >= range[0] && start < range[1])) &&
      (!f.walkInsOnly || e.walkIns) &&
      (!f.spotsLeft || !e.full)
    );
  });
}

/** Badge on the Filters button */
export function countMeetupFilters(f: MeetupFilters): number {
  return [f.categories.length > 0, f.when !== "any", f.walkInsOnly, f.spotsLeft].filter(Boolean).length;
}

export function fillPercent(event: MeetupEvent): number {
  return Math.round((event.going / event.cap) * 100);
}

/** Events without an end time go in the calendar as two hours long */
const DEFAULT_LENGTH_MS = 2 * 60 * 60 * 1000;

/**
 * "Add to calendar" entry for an event; the list has no description, the detail
 * page does. `alarms` are .ics triggers for the chosen reminders ("P1D").
 */
export function calendarEntry(event: MeetupEvent, desc = "", alarms: string[] = []): CalendarEvent {
  const start = new Date(event.startsAt);
  return {
    id: `event-${event.id}`,
    title: `${event.title} · UCompass`,
    location: `${event.where.name}, Adelaide SA`,
    details: `${desc ? `${desc}\n\n` : ""}Walk-in welcome. Host & guests stay anonymous on UCompass.`,
    start,
    end: event.endsAt ? new Date(event.endsAt) : new Date(start.getTime() + DEFAULT_LENGTH_MS),
    ...(alarms.length ? { alarms } : null),
  };
}

export const JOIN_TOAST = "You're in! Set a reminder if you'd like one.";

/** "For …" pills on a Study event; no levels (the API has none yet) or "Everyone" = all */
export function levelTags(event: MeetupEvent): string[] {
  const levels = event.levels?.length ? event.levels : ["Everyone"];
  return levels.includes("Everyone") ? ["All study levels"] : levels;
}

/** Label of the Join toggle on cards and sheets */
export function joinLabel(event: MeetupEvent): string {
  if (event.host) return "Hosting";
  if (event.joined) return "Going ✓";
  return event.full ? "Full" : "Join";
}

export type EventDraft = {
  title: string;
  cat: EventCategory;
  when: Date | null;
  /** A preset place id (the safe pickup points), or "custom" with a pin and optional place name */
  where: string;
  pin: MapPoint | null;
  place: string;
  desc: string;
  cap: number;
  walkIn: boolean;
  /** Editing: what the form can't show, sent back so the PUT doesn't clear it */
  kept?: { startsAt: string; endsAt: string | null; placeId: string | null; placeName: string | null };
};

export const EMPTY_EVENT: EventDraft = {
  title: "",
  cat: "Study",
  when: null,
  where: "barr-smith-library",
  pin: null,
  place: "",
  desc: "",
  cap: 20,
  walkIn: true,
};

// Same range as GET /api/events/options
export const CAPACITY = { min: 4, max: 60 };

export function eventProblem(draft: EventDraft, now: Date = new Date()): string | null {
  if (!draft.title.trim()) return "Give your event a name";
  if (!draft.when) return "Pick a date & time";
  if (draft.when <= now) return "Pick a time in the future";
  if (draft.where === "custom" && !draft.pin) return "Pin the location on the map";
  return null;
}

/** An edited event keeps its length: the end moves with the start */
function keptEnd(kept: EventDraft["kept"], start: Date): string | null {
  if (!kept?.endsAt) return null;
  const shift = start.getTime() - new Date(kept.startsAt).getTime();
  return new Date(new Date(kept.endsAt).getTime() + shift).toISOString();
}

/**
 * POST /api/events body. The picked time is an instant, so ISO (UTC) keeps it
 * exact; the API returns Adelaide-time labels for display.
 */
export function eventRequest(draft: EventDraft & { when: Date }): EventRequest {
  const pin = draft.where === "custom" ? draft.pin : null;
  return {
    title: draft.title.trim(),
    type: draft.cat,
    startsAt: draft.when.toISOString(),
    endsAt: keptEnd(draft.kept, draft.when),
    description: draft.desc.trim() || null,
    placeId: pin ? null : draft.where,
    placeName: pin ? draft.place.trim() || null : draft.kept?.placeId === draft.where ? draft.kept.placeName : null,
    lat: pin?.latitude ?? null,
    lng: pin?.longitude ?? null,
    capacity: draft.cap,
    walkInsWelcome: draft.walkIn,
  };
}
