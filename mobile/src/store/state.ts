import { EVENTS, FLATS, INITIAL_CHATS, ITEMS } from "@/data/seed";
import type { ChatMessage, ChatTopic, Flat, Item, MeetupEvent } from "@/data/types";

export type Consents = {
  terms: boolean;
  location: boolean;
  age: boolean;
  /** Optional: anonymous usage stats */
  stats: boolean;
};

export type Session = {
  /** True once login, consent and profile setup are done */
  signedIn: boolean;
  email: string;
  nick: string;
  major: string;
  /** Index into AVATAR_COLORS; -1 = no avatar */
  avatar: number;
  consents: Consents;
};

export type AppState = {
  session: Session;
  flats: Flat[];
  items: Item[];
  events: MeetupEvent[];
  /** Event ids the user tapped Join on */
  joined: Record<string, boolean>;
  chats: Record<string, ChatMessage[]>;
  chatTopics: Record<string, ChatTopic>;
  unread: Record<string, boolean>;
  /** Person currently "typing" a reply */
  typingWith: string | null;
};

export const NO_CONSENTS: Consents = { terms: false, location: false, age: false, stats: false };

export const initialState: AppState = {
  session: { signedIn: false, email: "", nick: "", major: "", avatar: -1, consents: NO_CONSENTS },
  flats: FLATS,
  items: ITEMS,
  events: EVENTS,
  joined: {},
  chats: INITIAL_CHATS,
  chatTopics: { p5: "item" },
  unread: { p5: true },
  typingWith: null,
};
