import type { LocalPhoto } from "@/api/photos";
import type { BathroomType, FlatRequest, Furnishing, ToiletType } from "@/api/types";
import type { Flat, MapPoint, Uni } from "@/data/types";
import { toDateOnly } from "@/lib/dates";

/** The Filters dialog; null = no limit */
export type FlatFilters = {
  rentMin: number | null;
  rentMax: number | null;
  maxBills: number | null;
  furnished: boolean;
  ensuite: boolean;
};

export const EMPTY_FLAT_FILTERS: FlatFilters = { rentMin: null, rentMax: null, maxBills: null, furnished: false, ensuite: false };

/** "Bills per week" choices in the dialog */
export const BILLS_OPTIONS: { label: string; max: number | null }[] = [
  { label: "Any", max: null },
  { label: "Up to $20", max: 20 },
  { label: "Up to $30", max: 30 },
  { label: "Up to $40", max: 40 },
];

/** Flats matching every filter */
export function filterFlats(flats: Flat[], f: FlatFilters): Flat[] {
  return flats.filter(
    (flat) =>
      (f.rentMin === null || flat.price >= f.rentMin) &&
      (f.rentMax === null || flat.price <= f.rentMax) &&
      (f.maxBills === null || flat.bills <= f.maxBills) &&
      (!f.furnished || flat.furnished === "Fully furnished") &&
      (!f.ensuite || /ensuite/i.test(flat.toilet)),
  );
}

/** Badge on the Filters button; the rent range counts once */
export function countFlatFilters(f: FlatFilters): number {
  return [f.rentMin !== null || f.rentMax !== null, f.maxBills !== null, f.furnished, f.ensuite].filter(Boolean).length;
}

/** Ends of the rent slider: the cheapest and dearest room, rounded out */
export function rentBounds(flats: Flat[]): { min: number; max: number } {
  if (!flats.length) return { min: 0, max: 500 };
  const prices = flats.map((f) => f.price);
  return { min: Math.floor(Math.min(...prices) / 10) * 10, max: Math.ceil(Math.max(...prices) / 50) * 50 };
}

// Same lists as GET /api/flats/options
export const FEATURE_OPTIONS = ["Air con", "Double bed", "Kitchenette", "Desk", "Wi-Fi included", "Laundry", "Parking", "Balcony"];
export const RHYTHM_OPTIONS = ["Quiet weeknights", "Social house", "Early birds", "Shared dinners", "Plant parents", "Gym crew"];

export const MAX_ROOM_PHOTOS = 5;
export const RENT = { min: 50, max: 2000 };

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
