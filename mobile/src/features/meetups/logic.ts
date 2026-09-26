import type { EventRequest } from "@/api/types";
import type { EventCategory, MapPoint, MeetupEvent } from "@/data/types";
import type { CalendarEvent } from "@/lib/calendar";

export const EVENT_CATEGORIES: EventCategory[] = ["Study", "Casual", "Social", "Food"];

/** Chips over the meetups map */
export const MEETUP_FILTERS = ["All", "Study", "Social", "Casual", "Food"] as const;
export type MeetupFilter = (typeof MEETUP_FILTERS)[number];

export function fillPercent(event: MeetupEvent): number {
  return Math.round((event.going / event.cap) * 100);
}

/** Events without an end time go in the calendar as two hours long */
const DEFAULT_LENGTH_MS = 2 * 60 * 60 * 1000;

/** "Add to calendar" entry for an event; the list has no description, the detail page does */
export function calendarEntry(event: MeetupEvent, desc = ""): CalendarEvent {
  const start = new Date(event.startsAt);
  return {
    id: `event-${event.id}`,
    title: `${event.title} · UCompass`,
    location: `${event.where.name}, Adelaide SA`,
    details: `${desc ? `${desc}\n\n` : ""}Walk-in welcome. Host & guests stay anonymous on UCompass.`,
    start,
    end: event.endsAt ? new Date(event.endsAt) : new Date(start.getTime() + DEFAULT_LENGTH_MS),
  };
}

export const JOIN_TOAST = "You're in. Just walk in — no one sees your name.";

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
    endsAt: null,
    description: draft.desc.trim() || null,
    placeId: pin ? null : draft.where,
    placeName: pin ? draft.place.trim() || null : null,
    lat: pin?.latitude ?? null,
    lng: pin?.longitude ?? null,
    capacity: draft.cap,
    walkInsWelcome: draft.walkIn,
  };
}
