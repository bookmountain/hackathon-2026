// "Remind me" choices for events you're going to, and the banners they raise
import type { MeetupEvent } from "@/data/types";

export type ReminderKey = "2d" | "1d";

/** Pill order, as in the design: two days first */
export const REMINDER_OPTIONS: { key: ReminderKey; label: string }[] = [
  { key: "2d", label: "2 days before" },
  { key: "1d", label: "1 day before" },
];

/** Event id → chosen reminders */
export type ReminderChoices = Record<string, ReminderKey[]>;

/** Switch one reminder on or off, keeping "2d" before "1d" */
export function toggleReminder(list: ReminderKey[], key: ReminderKey): ReminderKey[] {
  const next = list.includes(key) ? list.filter((k) => k !== key) : [...list, key];
  return REMINDER_OPTIONS.map((o) => o.key).filter((k) => next.includes(k));
}

/** The .ics VALARM triggers for the chosen reminders ("2d" → "P2D") */
export function reminderAlarms(list: ReminderKey[]): string[] {
  return list.map((k) => `P${k.toUpperCase()}`);
}

export type ReminderLabel = "Tomorrow" | "In 2 days";

export type DueReminder = { event: MeetupEvent; label: ReminderLabel; key: string };

/** A banner, once dismissed, stays gone for that event and label */
export const bannerKey = (eventId: string, label: ReminderLabel) => `${eventId}:${label}`;

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Banners at the top of the Meetups list: "Tomorrow" when the 1-day reminder is
 * on and the event is 0–1 days away, else "In 2 days" when the 2-day one is on
 * and it's 1–2 days away. Only events you're going to, minus dismissed banners.
 */
export function dueReminders(
  events: MeetupEvent[],
  choices: ReminderChoices,
  dismissed: string[],
  now: Date = new Date(),
): DueReminder[] {
  return events.flatMap((event) => {
    if (!event.joined || !event.startsAt) return [];
    const days = (new Date(event.startsAt).getTime() - now.getTime()) / DAY_MS;
    const chosen = choices[event.id] ?? [];
    let label: ReminderLabel | null = null;
    if (chosen.includes("1d") && days > 0 && days <= 1) label = "Tomorrow";
    else if (chosen.includes("2d") && days > 1 && days <= 2) label = "In 2 days";
    if (!label) return [];
    const key = bannerKey(event.id, label);
    return dismissed.includes(key) ? [] : [{ event, label, key }];
  });
}
