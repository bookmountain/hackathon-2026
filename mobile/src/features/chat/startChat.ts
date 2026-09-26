import { router } from "expo-router";
import type { ChatTopic } from "@/data/types";
import type { AppActions } from "@/store";

/**
 * Open (or continue) a chat from a listing and show it. `context` becomes a
 * one-off banner like "About: Sunny room…"; `firstMessage` is sent for the user.
 */
export function startChat(
  actions: AppActions,
  personId: string,
  topic: ChatTopic,
  context?: string,
  firstMessage?: string,
) {
  actions.openChat(personId, topic, context, firstMessage);
  router.push({ pathname: "/chats/[personId]", params: { personId } });
}
