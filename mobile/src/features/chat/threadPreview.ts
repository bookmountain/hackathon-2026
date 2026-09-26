import type { ChatMessage } from "@/data/types";

/** Last line shown under a name in the Messages list */
export function threadPreview(thread: ChatMessage[]): string {
  const last = thread.filter((m) => m.from !== "system").at(-1);
  if (!last) return "Say hi";
  return last.from === "me" ? `You: ${last.text}` : last.text;
}
