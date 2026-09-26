import { majorLabel, UNI_LABEL } from "@/data/adapters";
import type { Person, Uni } from "@/data/types";
import type { AppState } from "./state";

/** The design only lets @adelaide / @flinders emails in, so anything else is Adelaide */
export function uniOfEmail(email: string): Uni {
  return /flinders/i.test(email) ? "Flinders Uni" : "Adelaide Uni";
}

/** Signed in, consented and with a profile: the app proper is open */
export function selectSignedIn(state: AppState): boolean {
  const { token, me } = state.session;
  return !!token && !!me?.consentComplete && !!me.profile;
}

/** The signed-in user shaped like the other people in the app */
export function selectMe(state: AppState): Person {
  const { me, email } = state.session;
  const profile = me?.profile;
  return {
    id: me?.userId ?? "me",
    nick: profile?.displayName || "You",
    major: majorLabel(profile?.degree?.name ?? profile?.department),
    uni: me ? UNI_LABEL[me.university] : uniOfEmail(email),
    avatar: profile?.avatarPreset ?? -1,
    avatarUrl: profile?.avatarUrl,
  };
}

export function selectHasUnread(state: AppState): boolean {
  return state.chats.some((c) => c.unread > 0);
}
