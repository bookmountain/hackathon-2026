import type { Me } from "@/api/types";
import type { ChatMessage, ChatThread, Flat, Item, MeetupEvent, Pickup } from "@/data/types";
import { initialState, signedOutSession, type AppState, type Session } from "./state";

export type Action =
  | { type: "booted"; session: Partial<Session> }
  | { type: "setSession"; session: Partial<Session> }
  | { type: "setMe"; me: Me }
  | { type: "signOut" }
  | { type: "setFlats"; flats: Flat[] }
  | { type: "setItems"; items: Item[] }
  | { type: "setPickups"; pickups: Pickup[] }
  | { type: "setEvents"; events: MeetupEvent[] }
  | { type: "putEvent"; event: MeetupEvent }
  | { type: "setGoing"; eventId: string; going: number }
  | { type: "removeEvent"; eventId: string }
  | { type: "setChats"; chats: ChatThread[] }
  | { type: "putChat"; chat: ChatThread }
  | { type: "setMessages"; chatId: string; messages: ChatMessage[] }
  | { type: "addMessage"; chatId: string; message: ChatMessage; preview: string; unread: boolean }
  | { type: "markRead"; chatId: string }
  | { type: "setTyping"; chatId: string | null };

/** Replace the element with the same id, or put the new one first */
function upsert<T extends { id: string }>(list: T[], value: T): T[] {
  return list.some((x) => x.id === value.id) ? list.map((x) => (x.id === value.id ? value : x)) : [value, ...list];
}

export function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case "booted":
      return { ...state, session: { ...state.session, ...action.session, booted: true } };

    case "setSession":
      return { ...state, session: { ...state.session, ...action.session } };

    case "setMe":
      return { ...state, session: { ...state.session, me: action.me, email: action.me.email } };

    case "signOut":
      // Nothing from the last account stays in memory
      return { ...initialState, session: signedOutSession };

    case "setFlats":
      return { ...state, flats: action.flats };

    case "setItems":
      return { ...state, items: action.items };

    case "setPickups":
      return { ...state, pickups: action.pickups };

    case "setEvents":
      return { ...state, events: action.events };

    case "putEvent":
      return { ...state, events: upsert(state.events, action.event) };

    case "setGoing":
      return {
        ...state,
        events: state.events.map((e) =>
          e.id === action.eventId ? { ...e, going: action.going, full: action.going >= e.cap } : e,
        ),
      };

    case "removeEvent":
      return { ...state, events: state.events.filter((e) => e.id !== action.eventId) };

    case "setChats":
      return { ...state, chats: action.chats };

    case "putChat":
      return { ...state, chats: upsert(state.chats, action.chat) };

    case "setMessages":
      return { ...state, messages: { ...state.messages, [action.chatId]: action.messages } };

    case "addMessage": {
      const { chatId, message, preview, unread } = action;
      const thread = state.messages[chatId];
      const chat = state.chats.find((c) => c.id === chatId);
      // Real-time events can repeat a message already added from the send response
      const known = !!thread?.some((m) => m.id === message.id);
      return {
        ...state,
        typingIn: message.from === "them" && state.typingIn === chatId ? null : state.typingIn,
        messages: thread && !known ? { ...state.messages, [chatId]: [...thread, message] } : state.messages,
        chats: chat
          ? [
              { ...chat, preview, unread: unread && !known ? chat.unread + 1 : chat.unread, lastAt: new Date().toISOString() },
              ...state.chats.filter((c) => c.id !== chatId),
            ]
          : state.chats,
      };
    }

    case "markRead":
      return { ...state, chats: state.chats.map((c) => (c.id === action.chatId ? { ...c, unread: 0 } : c)) };

    case "setTyping":
      return { ...state, typingIn: action.chatId };
  }
}
