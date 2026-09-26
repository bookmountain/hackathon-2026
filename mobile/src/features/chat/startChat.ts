import { router } from "expo-router";
import type { StartChatRequest } from "@/api/types";
import type { AppActions } from "@/store";

/**
 * Open (or continue) the chat about a listing, or with a student, and show it.
 * The server adds the "About: …" line for flats and items; `text` is sent as the
 * first message.
 */
export async function startChat(actions: AppActions, req: StartChatRequest) {
  const id = await actions.startChat(req);
  router.push({ pathname: "/chats/[id]", params: { id } });
}
