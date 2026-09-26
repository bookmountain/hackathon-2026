import { useSubmit } from "@/api/hooks";
import { useToast } from "@/components/feedback/Toast";
import type { MeetupEvent } from "@/data/types";
import { useAppStore } from "@/store";
import { JOIN_TOAST, joinLabel } from "./logic";

/** Join / "Going ✓" for an event, shared by the map card, list rows and detail screen */
export function useJoin(event: MeetupEvent) {
  const { actions } = useAppStore();
  const toast = useToast();
  const { busy, submit } = useSubmit();
  return {
    joined: event.joined,
    going: event.going,
    label: joinLabel(event),
    busy,
    toggle: () => {
      if (event.host) return toast("You're hosting this one — it's anonymous");
      if (event.full && !event.joined) return toast("This event is full");
      void submit(async () => {
        const updated = await actions.toggleJoin(event);
        if (updated.joined) toast(JOIN_TOAST);
      });
    },
  };
}
