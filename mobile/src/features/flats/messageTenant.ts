import type { Flat } from "@/data/types";
import { startChat } from "@/features/chat/startChat";
import type { AppActions } from "@/store";
import { streetOf } from "./logic";

/** Opens a chat with the current tenant, with a first message; the server adds "About: {listing}" */
export async function messageTenant(flat: Flat, actions: AppActions, toast: (m: string) => void, message?: string) {
  if (flat.mine) {
    toast("This is your listing");
    return;
  }
  await startChat(actions, {
    flatId: flat.id,
    text: message || `Hi! Is the room at ${streetOf(flat.area)} still available?`,
  });
}
