import type { AvatarStyle, Me } from "@/api/types";
import type { ChatMessage, ChatThread, Flat, Item, MeetupEvent, Pickup } from "@/data/types";

export type Session = {
  /** False until the saved token (if any) has been checked on launch */
  booted: boolean;
  token: string | null;
  /** From GET /api/me; null until signed in */
  me: Me | null;
  /** Email being signed up or verified */
  email: string;
  /** Verification code the hosted demo API returns instead of emailing it */
  devCode: string | null;
};

export type AppState = {
  session: Session;
  flats: Flat[];
  items: Item[];
  pickups: Pickup[];
  events: MeetupEvent[];
  chats: ChatThread[];
  /** Loaded threads, by conversation id */
  messages: Record<string, ChatMessage[]>;
  /** Conversation whose other person is typing */
  typingIn: string | null;
  /** Your avatar style saved on this device, until the API stores it */
  localAvatarStyle: AvatarStyle | null;
};

export const signedOutSession: Session = { booted: true, token: null, me: null, email: "", devCode: null };

export const initialState: AppState = {
  session: { ...signedOutSession, booted: false },
  flats: [],
  items: [],
  pickups: [],
  events: [],
  chats: [],
  messages: {},
  typingIn: null,
  localAvatarStyle: null,
};
