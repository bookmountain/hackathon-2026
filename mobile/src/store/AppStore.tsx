import { createContext, useContext, useEffect, useMemo, useReducer, useRef, type ReactNode } from "react";
import type { ChatTopic, Flat, Item, MeetupEvent } from "@/data/types";
import { reducer } from "./reducer";
import { initialState, type AppState, type Consents, type Session } from "./state";

/** How long the other person "types" before a demo reply arrives */
export const REPLY_DELAY_MS = 1500;

function useStoreValue() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const replyTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(replyTimer.current), []);

  const actions = useMemo(() => {
    const queueReply = (personId: string) => {
      dispatch({ type: "setTyping", personId });
      clearTimeout(replyTimer.current);
      replyTimer.current = setTimeout(() => dispatch({ type: "receiveReply", personId }), REPLY_DELAY_MS);
    };

    return {
      signIn: (email: string) => dispatch({ type: "signIn", email }),
      setConsents: (consents: Consents) => dispatch({ type: "setConsents", consents }),
      updateProfile: (profile: Partial<Pick<Session, "nick" | "major" | "avatar">>) =>
        dispatch({ type: "updateProfile", profile }),
      enterApp: () => dispatch({ type: "enterApp" }),
      signOut: () => dispatch({ type: "signOut" }),
      toggleJoin: (eventId: string) => dispatch({ type: "toggleJoin", eventId }),
      addFlat: (flat: Flat) => dispatch({ type: "addFlat", flat }),
      addItem: (item: Item) => dispatch({ type: "addItem", item }),
      addEvent: (event: MeetupEvent) => dispatch({ type: "addEvent", event }),

      /** Opens a thread; with a first message, the other person replies after a delay */
      openChat: (personId: string, topic: ChatTopic, context?: string, firstMessage?: string) => {
        dispatch({ type: "openChat", personId, topic, context, firstMessage });
        if (firstMessage) queueReply(personId);
      },
      sendMessage: (personId: string, text: string) => {
        const trimmed = text.trim();
        if (!trimmed) return;
        dispatch({ type: "sendMessage", personId, text: trimmed });
        queueReply(personId);
      },
    };
  }, []);

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
