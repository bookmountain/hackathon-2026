import type { LocalPhoto } from "@/api/photos";
import type { BathroomType, FlatRequest, Furnishing, ToiletType } from "@/api/types";
import type { Flat, MapPoint, Uni } from "@/data/types";
import { toDateOnly } from "@/lib/dates";

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

// Same lists as GET /api/flats/options
export const FEATURE_OPTIONS = ["Air con", "Double bed", "Kitchenette", "Desk", "Wi-Fi included", "Laundry", "Parking", "Balcony"];
export const RHYTHM_OPTIONS = ["Quiet weeknights", "Social house", "Early birds", "Shared dinners", "Plant parents", "Gym crew"];

export const MAX_ROOM_PHOTOS = 5;
export const RENT = { min: 50, max: 2000 };

/** "Minimum stay" picker: months, or null for flexible */
export const MIN_STAY_OPTIONS: { label: string; months: number | null }[] = [
  { label: "Flexible", months: null },
  { label: "1 month", months: 1 },
  { label: "3 months", months: 3 },
  { label: "6 months", months: 6 },
  { label: "12 months", months: 12 },
];

/** Values collected by the "List a room" form */
export type RoomDraft = {
  photos: LocalPhoto[];
  title: string;
  street: string;
  suburb: string;
  pin: MapPoint | null;
  price: string;
  bills: string;
  beds: number;
  members: number;
  toilet: ToiletType;
  bath: BathroomType;
  minStay: number | null;
  furnished: Furnishing;
  feats: string[];
  rhythm: string[];
  pref: string;
  desc: string;
  from: Date | null;
};

export const EMPTY_ROOM: RoomDraft = {
  photos: [],
  title: "",
  street: "",
  suburb: "",
  pin: null,
  price: "",
  bills: "",
  beds: 3,
  members: 2,
  toilet: "PrivateEnsuite",
  bath: "Ensuite",
  minStay: null,
  furnished: "Fully",
  feats: [],
  rhythm: [],
  pref: "",
  desc: "",
  from: null,
};

/** What's still missing before the room can be published, or null when ready */
export function roomProblem(draft: RoomDraft): string | null {
  if (!draft.pin) return "Pin your flat on the map";
  if (!draft.photos.length || !draft.title.trim() || !draft.price) return "Add photos, title and rent";
  if (!draft.suburb.trim()) return "Add the suburb";
  const rent = Number(draft.price);
  if (rent < RENT.min || rent > RENT.max) return `Rent is $${RENT.min}–$${RENT.max} a week`;
  return null;
}

/** "Who lives here" line for yourself, e.g. "Flinders · Law" (the API allows 60 characters) */
export function housemateLine(me: { major: string; uni: Uni }): string {
  return `${me.uni.replace(" Uni", "")} · ${me.major || "Student"}`.slice(0, 60);
}

/** POST /api/flats body for a finished draft; `id` and `photoKeys` come from the photo upload */
export function flatRequest(
  draft: RoomDraft & { pin: MapPoint },
  me: { major: string; uni: Uni },
  id: string | null,
  photoKeys: string[],
): FlatRequest {
  return {
    id,
    title: draft.title.trim(),
    description: draft.desc.trim() || null,
    suburb: draft.suburb.trim(),
    street: draft.street.trim() || null,
    lat: draft.pin.latitude,
    lng: draft.pin.longitude,
    rentPerWeek: Number(draft.price),
    billsPerWeek: Number(draft.bills || 0),
    bedrooms: draft.beds,
    flatmates: draft.members,
    toilet: draft.toilet,
    bathroom: draft.bath,
    furnished: draft.furnished,
    minStayMonths: draft.minStay,
    availableFrom: draft.from ? toDateOnly(draft.from) : null,
    features: draft.feats,
    houseRhythm: draft.rhythm,
    preferredFlatmate: draft.pref.trim() || null,
    housemates: [housemateLine(me)],
    photoKeys,
  };
}

/** Street part of an area ("Adelaide · Frome St" → "Frome St") for the opening message */
export function streetOf(area: string): string {
  return area.split("· ")[1] ?? area;
}
