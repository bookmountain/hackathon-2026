import type { Flat } from "@/data/types";
import { startChat } from "@/features/chat/startChat";
import type { AppActions } from "@/store";
import { streetOf } from "./logic";

/** Opens a chat with the current tenant, pre-filled with a first message */
export function messageTenant(flat: Flat, actions: AppActions, toast: (m: string) => void, message?: string) {
  if (flat.tenant === "me") {
    toast("This is your listing");
    return;
  }
  startChat(
    actions,
    flat.tenant,
    "flat",
    `About: ${flat.title}`,
    message || `Hi! Is the room at ${streetOf(flat.area)} still available?`,
  );
}
