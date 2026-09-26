import { useToast } from "@/components/feedback/Toast";
import type { MeetupEvent } from "@/data/types";
import { useAppStore } from "@/store";
import { goingCount, JOIN_TOAST } from "./logic";

/** Join state for an event, shared by the map card, list rows and detail screen */
export function useJoin(event: MeetupEvent) {
  const { state, actions } = useAppStore();
  const toast = useToast();
  const joined = !!state.joined[event.id];
  return {
    joined,
    going: goingCount(event, joined),
    toggle: () => {
      actions.toggleJoin(event.id);
      if (!joined) toast(JOIN_TOAST);
    },
  };
}
