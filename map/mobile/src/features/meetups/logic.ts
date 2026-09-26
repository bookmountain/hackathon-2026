import { PICKUPS } from "@/data/seed";
import type { EventCategory, MapPoint, MeetupEvent } from "@/data/types";
import { clockTime, eventWhen, weekdayCaps } from "@/lib/dates";

export const EVENT_CATEGORIES: EventCategory[] = ["Study", "Casual", "Social", "Food"];

/** Headcount including you once you've tapped Join */
export function goingCount(event: MeetupEvent, joined: boolean): number {
  return event.going + (joined ? 1 : 0);
}

export function fillPercent(event: MeetupEvent, joined: boolean): number {
  return Math.round((goingCount(event, joined) / event.cap) * 100);
}

export const JOIN_TOAST = "You're in. Just walk in — no one sees your name.";

export type EventDraft = {
  title: string;
  cat: EventCategory;
  when: Date | null;
  /** A safe pickup id, or "custom" with a pin and optional place name */
  where: string;
  pin: MapPoint | null;
  place: string;
  cap: number;
  walkIn: boolean;
};

export const EMPTY_EVENT: EventDraft = {
  title: "",
  cat: "Study",
  when: null,
  where: "bsl",
  pin: null,
  place: "",
  cap: 20,
  walkIn: true,
};

export const CAPACITY = { min: 4, max: 60 };

/** Events at a central spot sit just off its pickup marker so both stay tappable */
const OFFSET_FROM_PICKUP = { x: 14, y: 18 };

export function eventProblem(draft: EventDraft): string | null {
  if (!draft.title.trim()) return "Give your event a name";
  if (draft.where === "custom" && !draft.pin) return "Pin the location on the map";
  return null;
}

/** Turn a finished draft into an event; without a date it defaults to two days from `now` */
export function buildEvent(draft: EventDraft, id: string, now: Date): MeetupEvent {
  const date = draft.when ?? new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);
  const pickup = PICKUPS.find((p) => p.id === draft.where);
  const where =
    draft.where === "custom" && draft.pin
      ? { name: draft.place.trim() || "Pinned location", ...draft.pin }
      : {
          name: pickup?.name ?? "Pinned location",
          x: (pickup?.x ?? 0) + OFFSET_FROM_PICKUP.x,
          y: (pickup?.y ?? 0) + OFFSET_FROM_PICKUP.y,
        };
  return {
    id,
    title: draft.title.trim(),
    cat: draft.cat,
    day: weekdayCaps(date),
    date: String(date.getDate()),
    time: clockTime(date),
    when: eventWhen(date),
    where,
    going: 0,
    cap: draft.cap,
    desc: `Hosted anonymously. ${draft.walkIn ? "Walk-ins welcome." : "RSVP to join."}`,
  };
}
