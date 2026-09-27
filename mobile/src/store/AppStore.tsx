import * as SecureStore from "expo-secure-store";
import { createContext, useContext, useEffect, useMemo, useReducer, useRef, type ReactNode } from "react";
import { setToken, setUnauthorizedHandler } from "@/api/client";
import * as api from "@/api/endpoints";
import { connectRealtime, type Realtime } from "@/api/realtime";
import type {
  AuthResponse,
  AvatarStyle,
  ChatMessageDto,
  EventRequest,
  FlatRequest,
  ItemRequest,
  Me,
  StartChatRequest,
} from "@/api/types";
import { previewOf, toEvent, toFlat, toItem, toMessage, toMyEvents, toPickup, toThread } from "@/data/adapters";
import type { Flat, Item, MeetupEvent, Pickup } from "@/data/types";
import { reducer } from "./reducer";
import { selectSignedIn } from "./selectors";
import { initialState, type AppState } from "./state";

/** How long "•••" stays up after the last typing ping */
export const TYPING_TIMEOUT_MS = 4000;

const TOKEN_KEY = "ucompass.token";
/** Per account: SecureStore keys allow only letters, digits, ".", "-" and "_" */
const avatarStyleKey = (userId: string) => `ucompass.avatarStyle.${userId}`;

async function readAvatarStyle(userId: string): Promise<AvatarStyle | null> {
  const raw = await readStored(avatarStyleKey(userId));
  if (!raw) return null;
  try {
    const style = JSON.parse(raw) as AvatarStyle;
    // Saved before the API existed, in lowercase ("circle"); the API uses its enum names ("Circle")
    const name = <T extends string>(v: T) => (v.charAt(0).toUpperCase() + v.slice(1)) as T;
    return { ...style, mode: name(style.mode), icon: name(style.icon), shape: name(style.shape), ring: name(style.ring) };
  } catch {
    return null;
  }
}

// SecureStore can be unavailable (e.g. on web); the app then just forgets the session on reload
async function readStored(key: string): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(key);
  } catch {
    return null;
  }
}

async function writeStored(key: string, value: string | null) {
  try {
    if (value === null) await SecureStore.deleteItemAsync(key);
    else await SecureStore.setItemAsync(key, value);
  } catch {
    // Not persisted; the session still works until the app restarts
  }
}

function useStoreValue() {
  const [state, dispatch] = useReducer(reducer, initialState);
  // Real-time handlers and async actions read the latest state through this
  const stateRef = useRef<AppState>(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);
  const realtime = useRef<Realtime | null>(null);
  const typingTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const actions = useMemo(() => {
    const signOut = () => {
      setToken(null);
      void writeStored(TOKEN_KEY, null);
      dispatch({ type: "signOut" });
    };

    const loadAvatarStyle = async (userId: string) => {
      dispatch({ type: "setAvatarStyle", style: await readAvatarStyle(userId) });
    };

    const refreshMe = async (): Promise<Me> => {
      const me = await api.me.get();
      dispatch({ type: "setMe", me });
      return me;
    };

    const loadChats = async () => {
      const chats = await api.chats.list();
      dispatch({ type: "setChats", chats: chats.map(toThread) });
    };

    /** The safe pickup points (they name items' pickups), loaded once */
    const ensurePickups = async (): Promise<Pickup[]> => {
      if (stateRef.current.pickups.length) return stateRef.current.pickups;
      const pickups = (await api.items.pickupPoints()).map(toPickup);
      dispatch({ type: "setPickups", pickups });
      return pickups;
    };

    const receiveMessage = (dto: ChatMessageDto) => {
      if (!stateRef.current.chats.some((c) => c.id === dto.conversationId)) {
        // Someone started a new chat with you
        void loadChats().catch(() => {});
        return;
      }
      dispatch({
        type: "addMessage",
        chatId: dto.conversationId,
        message: toMessage(dto),
        preview: previewOf(dto),
        unread: !dto.isMine,
      });
    };

    return {
      signOut,
      refreshMe,

      /** Remember the address being signed up, and the code the demo API hands back */
      setPending: (email: string, devCode: string | null) => dispatch({ type: "setSession", session: { email, devCode } }),

      /** After login or verify: keep the token and load the account */
      signIn: async (auth: AuthResponse): Promise<Me> => {
        setToken(auth.accessToken);
        const me = await api.me.get();
        await writeStored(TOKEN_KEY, auth.accessToken);
        dispatch({ type: "setSession", session: { token: auth.accessToken, me, email: me.email, devCode: null } });
        void loadAvatarStyle(me.userId);
        return me;
      },

      /** Your avatar's shape, ring and initials/icon, kept on the device until the API stores it */
      saveAvatarStyle: async (style: AvatarStyle | null) => {
        const userId = stateRef.current.session.me?.userId;
        dispatch({ type: "setAvatarStyle", style });
        if (userId) await writeStored(avatarStyleKey(userId), style ? JSON.stringify(style) : null);
      },

      /** Deletes the account and everything in it, then signs out */
      deleteAccount: async () => {
        await api.me.deleteAccount();
        signOut();
      },

      loadFlats: async () => {
        const flats = await api.flats.list();
        const now = new Date();
        dispatch({ type: "setFlats", flats: flats.map((f) => toFlat(f, now)) });
      },

      loadItems: async () => {
        const [items, points] = await Promise.all([api.items.list(), api.items.pickupPoints()]);
        const pickups = points.map(toPickup);
        const now = new Date();
        dispatch({ type: "setPickups", pickups });
        dispatch({ type: "setItems", items: items.map((i) => toItem(i, pickups, now)) });
      },

      /** The safe pickup points, also the Host form's preset places */
      loadPickups: async () => {
        const points = await api.items.pickupPoints();
        dispatch({ type: "setPickups", pickups: points.map(toPickup) });
      },

      loadEvents: async () => {
        const events = await api.events.list();
        dispatch({ type: "setEvents", events: events.map(toEvent) });
      },

      putEvent: (event: MeetupEvent) => dispatch({ type: "putEvent", event }),

      /** Save your event; `levels` (Study events) are kept on this phone, the API has no field for them */
      updateEvent: async (id: string, req: EventRequest, levels?: string[]): Promise<MeetupEvent> => {
        const event = toEvent((await api.events.update(id, req)).summary);
        const updated = levels ? { ...event, levels } : event;
        dispatch({ type: "putEvent", event: updated });
        return updated;
      },

      /** Cancel your event; everyone going is told */
      deleteEvent: async (id: string) => {
        await api.events.remove(id);
        dispatch({ type: "removeEvent", eventId: id });
      },

      /** Leave an event you joined; resolves to the updated event */
      leaveEvent: async (id: string): Promise<MeetupEvent> => {
        const updated = toEvent(await api.events.leave(id));
        dispatch({ type: "putEvent", event: updated });
        return updated;
      },

      /** Profile's "My activity": meetups you host or joined, your rooms and your listings */
      loadMine: async () => {
        const [hosted, going, flats, items, pickups] = await Promise.all([
          api.events.mine(),
          api.events.going(),
          api.flats.mine(),
          api.items.mine(),
          ensurePickups(),
        ]);
        const now = new Date();
        dispatch({
          type: "setMine",
          mine: {
            events: toMyEvents(hosted, going),
            flats: flats.map((f) => toFlat(f, now)),
            items: items.map((i) => toItem(i, pickups, now)),
          },
        });
      },

      updateFlat: async (id: string, req: FlatRequest): Promise<Flat> => {
        const flat = toFlat((await api.flats.update(id, req)).summary);
        dispatch({ type: "putFlat", flat });
        return flat;
      },

      deleteFlat: async (id: string) => {
        await api.flats.remove(id);
        dispatch({ type: "removeFlat", flatId: id });
      },

      updateItem: async (id: string, req: ItemRequest): Promise<Item> => {
        const [detail, pickups] = await Promise.all([api.items.update(id, req), ensurePickups()]);
        const item = toItem(detail.summary, pickups);
        dispatch({ type: "putItem", item });
        return item;
      },

      deleteItem: async (id: string) => {
        await api.items.remove(id);
        dispatch({ type: "removeItem", itemId: id });
      },

      /** Join / "Going ✓"; resolves to the updated event */
      toggleJoin: async (event: MeetupEvent): Promise<MeetupEvent> => {
        const updated = toEvent(event.joined ? await api.events.leave(event.id) : await api.events.join(event.id));
        dispatch({ type: "putEvent", event: updated });
        return updated;
      },

      loadChats,

      /** Opens (or reuses) a chat; resolves to its id */
      startChat: async (req: StartChatRequest): Promise<string> => {
        const chat = await api.chats.start(req);
        dispatch({ type: "putChat", chat: toThread(chat) });
        return chat.id;
      },

      loadMessages: async (chatId: string) => {
        const messages = await api.chats.messages(chatId);
        dispatch({ type: "setMessages", chatId, messages: messages.map(toMessage) });
      },

      sendMessage: async (chatId: string, text: string) => {
        const trimmed = text.trim();
        if (!trimmed) return;
        receiveMessage(await api.chats.send(chatId, trimmed));
      },

      markRead: async (chatId: string) => {
        dispatch({ type: "markRead", chatId });
        await api.chats.markRead(chatId);
      },

      /** Shows "•••" to the other person */
      typing: (chatId: string) => realtime.current?.send("Typing", chatId),

      /** Used by the real-time connection */
      receiveMessage,
      showTyping: (chatId: string) => {
        dispatch({ type: "setTyping", chatId });
        clearTimeout(typingTimer.current);
        typingTimer.current = setTimeout(() => dispatch({ type: "setTyping", chatId: null }), TYPING_TIMEOUT_MS);
      },
    };
  }, []);

  // Restore the saved session on launch
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const token = await readStored(TOKEN_KEY);
      if (!token) return dispatch({ type: "booted", session: {} });
      setToken(token);
      try {
        const me = await api.me.get();
        const style = await readAvatarStyle(me.userId);
        if (cancelled) return;
        dispatch({ type: "setAvatarStyle", style });
        dispatch({ type: "booted", session: { token, me, email: me.email } });
      } catch {
        // Expired token or offline: start from the login screen
        setToken(null);
        if (!cancelled) dispatch({ type: "booted", session: {} });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(actions.signOut);
    return () => setUnauthorizedHandler(null);
  }, [actions]);

  // Live chat and meetup headcounts while signed in
  const signedIn = selectSignedIn(state);
  const token = state.session.token;
  useEffect(() => {
    if (!signedIn || !token) return;
    void actions.loadChats().catch(() => {});
    const connection = connectRealtime(token, {
      message: actions.receiveMessage,
      typing: ({ conversationId }: { conversationId: string }) => actions.showTyping(conversationId),
      eventGoing: ({ eventId, goingCount }: { eventId: string; goingCount: number }) =>
        dispatch({ type: "setGoing", eventId, going: goingCount }),
      eventUpdated: ({ eventId }: { eventId: string }) => {
        api.events.get(eventId).then((d) => dispatch({ type: "putEvent", event: toEvent(d.summary) }), () => {});
      },
      eventCancelled: ({ eventId }: { eventId: string }) => dispatch({ type: "removeEvent", eventId }),
    });
    realtime.current = connection;
    return () => {
      connection.close();
      realtime.current = null;
      clearTimeout(typingTimer.current);
    };
  }, [signedIn, token, actions]);

  return { state, actions };
}

type Store = ReturnType<typeof useStoreValue>;
export type AppActions = Store["actions"];

const StoreContext = createContext<Store | null>(null);

export function AppStoreProvider({ children }: { children: ReactNode }) {
  const store = useStoreValue();
  return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>;
}

export function useAppStore(): { state: AppState; actions: AppActions } {
  const store = useContext(StoreContext);
  if (!store) throw new Error("useAppStore must be used inside <AppStoreProvider>");
  return store;
}
