// Reminder choices and dismissed banners, kept on the device per account (the
// API has nothing for them). Shared by the list cards, banners and detail page.
import { deviceStore } from "@/lib/deviceStore";
import { useAppStore } from "@/store";
import { toggleReminder, type ReminderChoices, type ReminderKey } from "./reminders";

type Stored = { choices: ReminderChoices; dismissed: string[] };

const EMPTY: Stored = { choices: {}, dismissed: [] };
/** Dismissed banners only matter for a couple of days; keep the newest */
const MAX_DISMISSED = 40;

const store = deviceStore<Stored>("reminders", EMPTY);

export function toggleEventReminder(eventId: string, key: ReminderKey) {
  store.update((s) => {
    const list = toggleReminder(s.choices[eventId] ?? [], key);
    const choices = { ...s.choices };
    if (list.length) choices[eventId] = list;
    else delete choices[eventId];
    return { ...s, choices };
  });
}

export function dismissReminder(bannerKey: string) {
  store.update((s) =>
    s.dismissed.includes(bannerKey) ? s : { ...s, dismissed: [...s.dismissed, bannerKey].slice(-MAX_DISMISSED) },
  );
}

/** This account's reminders (empty until loaded) */
export function useReminders(): Stored {
  const { state } = useAppStore();
  return store.useValue(state.session.me?.userId ?? null).value;
}

/** Reminders chosen for one event */
export function useEventReminders(eventId: string): ReminderKey[] {
  return useReminders().choices[eventId] ?? NONE;
}

const NONE: ReminderKey[] = [];
