import { REPLIES } from "@/data/seed";
import type { ChatTopic, Flat, Item, MeetupEvent } from "@/data/types";
import type { AppState, Consents, Session } from "./state";

export type Action =
  | { type: "signIn"; email: string }
  | { type: "setConsents"; consents: Consents }
  | { type: "updateProfile"; profile: Partial<Pick<Session, "nick" | "major" | "avatar">> }
  | { type: "enterApp" }
  | { type: "signOut" }
  | { type: "toggleJoin"; eventId: string }
  | { type: "addFlat"; flat: Flat }
  | { type: "addItem"; item: Item }
  | { type: "addEvent"; event: MeetupEvent }
  | { type: "openChat"; personId: string; topic: ChatTopic; context?: string; firstMessage?: string }
  | { type: "sendMessage"; personId: string; text: string }
  | { type: "setTyping"; personId: string | null }
  | { type: "receiveReply"; personId: string };

export function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case "signIn":
      return { ...state, session: { ...state.session, email: action.email } };

    case "setConsents":
      return { ...state, session: { ...state.session, consents: action.consents } };

    case "updateProfile":
      return { ...state, session: { ...state.session, ...action.profile } };

    case "enterApp":
      return { ...state, session: { ...state.session, signedIn: true } };

    case "signOut":
      // Like the design, the profile is kept so signing back in skips setup
      return { ...state, session: { ...state.session, signedIn: false } };

    case "toggleJoin":
      return { ...state, joined: { ...state.joined, [action.eventId]: !state.joined[action.eventId] } };

    case "addFlat":
      return { ...state, flats: [action.flat, ...state.flats] };

    case "addItem":
      return { ...state, items: [action.item, ...state.items] };

    case "addEvent":
      // Hosts are counted as going to their own event
      return {
        ...state,
        events: [action.event, ...state.events],
        joined: { ...state.joined, [action.event.id]: true },
      };

    case "openChat": {
      const { personId, topic, context, firstMessage } = action;
      const thread = [...(state.chats[personId] ?? [])];
      // Each listing/context line appears once per thread, however often it's opened
      if (context && !thread.some((m) => m.from === "system" && m.text === context)) {
        thread.push({ from: "system", text: context });
      }
      if (firstMessage) thread.push({ from: "me", text: firstMessage });
      return {
        ...state,
        chats: { ...state.chats, [personId]: thread },
        chatTopics: { ...state.chatTopics, [personId]: topic },
        unread: { ...state.unread, [personId]: false },
      };
    }

    case "sendMessage":
      return {
        ...state,
        chats: {
          ...state.chats,
          [action.personId]: [...(state.chats[action.personId] ?? []), { from: "me", text: action.text }],
        },
      };

    case "setTyping":
      return { ...state, typingWith: action.personId };

    case "receiveReply": {
      const thread = state.chats[action.personId] ?? [];
      const replies = REPLIES[state.chatTopics[action.personId] ?? "person"];
      // Cycle through the canned replies in order
      const sentSoFar = thread.filter((m) => m.from === "them").length;
      return {
        ...state,
        typingWith: state.typingWith === action.personId ? null : state.typingWith,
        chats: {
          ...state.chats,
          [action.personId]: [...thread, { from: "them", text: replies[sentSoFar % replies.length] }],
        },
      };
    }
  }
}
