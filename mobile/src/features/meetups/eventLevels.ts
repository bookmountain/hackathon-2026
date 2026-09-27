// Who a study event is for ("Undergrad", "PhD"…). The API has no field for it, so
// the host's choice is kept on their phone, per account, by event id.
import { deviceStore } from "@/lib/deviceStore";
import { useAppStore } from "@/store";

type Levels = Record<string, string[]>;

const store = deviceStore<Levels>("eventLevels", {});

/** Remember (or forget, with no levels) the levels for an event you host */
export function setEventLevels(eventId: string, levels: string[] | undefined) {
  store.update((all) => {
    const next = { ...all };
    if (levels?.length) next[eventId] = levels;
    else delete next[eventId];
    return next;
  });
}

/** Read now, outside render (e.g. when a form fills itself in); undefined until loaded */
export function getEventLevels(eventId: string): string[] | undefined {
  return store.get().value[eventId];
}

/** The levels saved on this phone for an event, if any */
export function useEventLevels(eventId: string | undefined): string[] | undefined {
  const { state } = useAppStore();
  const all = store.useValue(state.session.me?.userId ?? null).value;
  return eventId ? all[eventId] : undefined;
}
