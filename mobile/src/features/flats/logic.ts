import type { Flat, MapPoint, Uni } from "@/data/types";
import { dayMonth } from "@/lib/dates";
import { CAMPUS, walkMinutes } from "@/features/map/geometry";

export const FLAT_FILTERS = ["Under $250", "Furnished", "Ensuite", "Bills < $30"] as const;
export type FlatFilter = (typeof FLAT_FILTERS)[number];

const MATCHES: Record<FlatFilter, (f: Flat) => boolean> = {
  "Under $250": (f) => f.price < 250,
  Furnished: (f) => f.furnished === "Fully furnished",
  Ensuite: (f) => /ensuite/i.test(f.toilet),
  "Bills < $30": (f) => f.bills < 30,
};

/** Flats matching every active filter */
export function filterFlats(flats: Flat[], active: FlatFilter[]): Flat[] {
  return flats.filter((f) => active.every((filter) => MATCHES[filter](f)));
}

export const FEATURE_OPTIONS = ["Air con", "Double bed", "Kitchenette", "Desk", "Wi-Fi included", "Laundry", "Parking", "Balcony"];
export const RHYTHM_OPTIONS = ["Quiet weeknights", "Social house", "Early birds", "Shared dinners", "Plant parents", "Gym crew"];

/** Values collected by the "List a room" form */
export type RoomDraft = {
  photo: boolean;
  title: string;
  area: string;
  pin: MapPoint | null;
  price: string;
  bills: string;
  beds: number;
  members: number;
  toilet: "Private ensuite" | "Shared toilet";
  bath: "Ensuite shower" | "Shared bathroom";
  minStay: string;
  furnished: "Fully furnished" | "Partly furnished" | "Unfurnished";
  feats: string[];
  rhythm: string[];
  pref: string;
  from: Date | null;
};

export const EMPTY_ROOM: RoomDraft = {
  photo: false,
  title: "",
  area: "",
  pin: null,
  price: "",
  bills: "",
  beds: 3,
  members: 2,
  toilet: "Private ensuite",
  bath: "Ensuite shower",
  minStay: "",
  furnished: "Fully furnished",
  feats: [],
  rhythm: [],
  pref: "",
  from: null,
};

/** What's still missing before the room can be published, or null when ready */
export function roomProblem(draft: RoomDraft): string | null {
  if (!draft.pin) return "Pin your flat on the map";
  if (!draft.photo || !draft.title.trim() || !draft.price) return "Add photos, title and rent";
  return null;
}

/** Turn a finished draft into a listing owned by "me" */
export function buildFlat(draft: RoomDraft & { pin: MapPoint }, me: { major: string; uni: Uni }, id: string): Flat {
  return {
    id,
    title: draft.title.trim(),
    area: `Adelaide · ${draft.area.trim() || "Pinned location"}`,
    price: Number(draft.price),
    bills: Number(draft.bills || 0),
    beds: draft.beds,
    toilet: draft.toilet,
    bath: draft.bath,
    members: draft.members,
    minStay: draft.minStay.trim() || "Flexible",
    furnished: draft.furnished,
    pref: draft.pref.trim() || "Any verified student",
    feats: draft.feats.length ? draft.feats : ["Ask the tenant"],
    walkA: walkMinutes(draft.pin, CAMPUS.adelaide),
    walkF: walkMinutes(draft.pin, CAMPUS.flindersCity),
    tenant: "me",
    from: draft.from ? `From ${dayMonth(draft.from)}` : "Available now",
    tenants: [`${me.uni} · ${me.major || "Student"} (you)`],
    rhythm: draft.rhythm.length ? draft.rhythm : ["Ask the tenant"],
    latitude: draft.pin.latitude,
    longitude: draft.pin.longitude,
    tone: "#DCE6FF",
  };
}

/** Street part of an area ("Adelaide CBD · Frome St" → "Frome St") for the opening message */
export function streetOf(area: string): string {
  return area.split("· ")[1] ?? area;
}
