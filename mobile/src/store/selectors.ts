import { PEOPLE, PICKUPS } from "@/data/seed";
import type { MapPoint, Person, Place, Uni } from "@/data/types";
import type { AppState } from "./state";

/** The design only lets @adelaide / @flinders emails in, so anything else is Adelaide */
export function uniOfEmail(email: string): Uni {
  return /flinders/i.test(email) ? "Flinders Uni" : "Adelaide Uni";
}

export function findPerson(id: string): Person | undefined {
  return PEOPLE.find((p) => p.id === id);
}

/** The signed-in user shaped like the other people in the app */
export function selectMe(state: AppState): Person {
  const { nick, major, avatar, email } = state.session;
  return { id: "me", nick: nick || "You", major, uni: uniOfEmail(email), avatar };
}

export type ResolvedPlace = MapPoint & {
  name: string;
  /** Short label for cards, e.g. "Barr Smith" */
  short: string;
  /** Safe pickup description, empty for custom pins */
  sub: string;
  /** True for the suggested safe pickup points */
  central: boolean;
};

export function resolvePlace(place: Place): ResolvedPlace {
  if (typeof place !== "string") return { ...place, short: place.name, sub: "", central: false };
  const pickup = PICKUPS.find((p) => p.id === place);
  if (!pickup) throw new Error(`Unknown pickup point "${place}"`);
  return { ...pickup, central: true };
}

export function selectHasUnread(state: AppState): boolean {
  return Object.values(state.unread).some(Boolean);
}
