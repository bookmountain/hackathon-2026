import type { AvatarStyle, Me } from "@/api/types";
import type { ChatMessage, ChatThread, Flat, Item, MeetupEvent, Pickup } from "@/data/types";
import { initialState, signedOutSession, type AppState, type MyActivity, type Session } from "./state";

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
  | { type: "setMine"; mine: MyActivity }
  | { type: "putFlat"; flat: Flat }
  | { type: "removeFlat"; flatId: string }
  | { type: "putItem"; item: Item }
  | { type: "removeItem"; itemId: string }
  | { type: "setGoing"; eventId: string; going: number }
  | { type: "removeEvent"; eventId: string }
  | { type: "setChats"; chats: ChatThread[] }
  | { type: "putChat"; chat: ChatThread }
  | { type: "setMessages"; chatId: string; messages: ChatMessage[] }
  | { type: "addMessage"; chatId: string; message: ChatMessage; preview: string; unread: boolean }
  | { type: "markRead"; chatId: string }
  | { type: "setTyping"; chatId: string | null }
  | { type: "setAvatarStyle"; style: AvatarStyle | null };

/** Replace the element with the same id, or put the new one first */
function upsert<T extends { id: string }>(list: T[], value: T): T[] {
  return list.some((x) => x.id === value.id) ? list.map((x) => (x.id === value.id ? value : x)) : [value, ...list];
}

/**
 * The API has no study levels yet, so they only live on events this phone published or
 * edited: keep them when the same event comes back from the API without them
 */
function keepLevels(next: MeetupEvent, old: MeetupEvent | undefined): MeetupEvent {
  return next.levels || !old?.levels ? next : { ...next, levels: old.levels };
}

const byStart = (a: MeetupEvent, b: MeetupEvent) => Date.parse(a.startsAt) - Date.parse(b.startsAt);

/** "My activity" keeps the events you host or go to; leaving one drops it */
function putMyEvent(mine: MyActivity | null, event: MeetupEvent): MyActivity | null {
  if (!mine) return mine;
  const others = mine.events.filter((e) => e.id !== event.id);
  const events = event.host || event.joined ? [...others, event].sort(byStart) : others;
  return { ...mine, events };
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

    case "setEvents": {
      const old = new Map(state.events.map((e) => [e.id, e]));
      return { ...state, events: action.events.map((e) => keepLevels(e, old.get(e.id))) };
    }

    case "putEvent": {
      const event = keepLevels(
        action.event,
        state.events.find((e) => e.id === action.event.id) ?? state.mine?.events.find((e) => e.id === action.event.id),
      );
      return { ...state, events: upsert(state.events, event), mine: putMyEvent(state.mine, event) };
    }

    case "setMine": {
      const old = new Map(state.events.map((e) => [e.id, e]));
      return { ...state, mine: { ...action.mine, events: action.mine.events.map((e) => keepLevels(e, old.get(e.id))) } };
    }

    case "putFlat": {
      const { flat } = action;
      // Taken rooms are hidden from search, so they only stay in your own list
      const flats = flat.taken ? state.flats.filter((f) => f.id !== flat.id) : upsert(state.flats, flat);
      return { ...state, flats, mine: state.mine && { ...state.mine, flats: upsert(state.mine.flats, flat) } };
    }

    case "removeFlat":
      return {
        ...state,
        flats: state.flats.filter((f) => f.id !== action.flatId),
        mine: state.mine && { ...state.mine, flats: state.mine.flats.filter((f) => f.id !== action.flatId) },
      };

    case "putItem":
      return {
        ...state,
        items: upsert(state.items, action.item),
        mine: state.mine && { ...state.mine, items: upsert(state.mine.items, action.item) },
      };

    case "removeItem":
      return {
        ...state,
        items: state.items.filter((i) => i.id !== action.itemId),
        mine: state.mine && { ...state.mine, items: state.mine.items.filter((i) => i.id !== action.itemId) },
      };

    case "setGoing": {
      const count = (e: MeetupEvent) =>
        e.id === action.eventId ? { ...e, going: action.going, full: action.going >= e.cap } : e;
      return { ...state, events: state.events.map(count), mine: state.mine && { ...state.mine, events: state.mine.events.map(count) } };
    }

    case "removeEvent":
      return {
        ...state,
        events: state.events.filter((e) => e.id !== action.eventId),
        mine: state.mine && { ...state.mine, events: state.mine.events.filter((e) => e.id !== action.eventId) },
      };

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

    case "setAvatarStyle":
      return { ...state, localAvatarStyle: action.style };
  }
}
