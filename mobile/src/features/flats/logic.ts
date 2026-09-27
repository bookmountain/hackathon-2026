import type { LocalPhoto } from "@/api/photos";
import type { BathroomType, FlatRequest, Furnishing, ToiletType } from "@/api/types";
import type { Flat, MapPoint, Uni } from "@/data/types";
import { toDateOnly } from "@/lib/dates";

/** "Furnished" choices; the values match `Flat.furnished` */
export const FURNISHED_OPTIONS = [
  { label: "Any", value: "Any" },
  { label: "Fully", value: "Fully furnished" },
  { label: "Partly", value: "Partly furnished" },
  { label: "None", value: "Unfurnished" },
] as const;
export type FurnishedFilter = (typeof FURNISHED_OPTIONS)[number]["value"];
export type ToiletFilter = "Any" | "Ensuite" | "Shared";

/** The Filter rooms sheet; null / 0 / "Any" = no limit */
export type FlatFilters = {
  maxRent: number | null;
  maxBills: number | null;
  /** Bedrooms at least this many */
  minBeds: number;
  furnished: FurnishedFilter;
  toilet: ToiletFilter;
  maxMates: number | null;
};

export const EMPTY_FLAT_FILTERS: FlatFilters = { maxRent: null, maxBills: null, minBeds: 0, furnished: "Any", toilet: "Any", maxMates: null };

/** The two sliders; the top of each reads "Any" (no limit) */
export const RENT_SLIDER = { min: 100, max: 500, step: 10 };
export const BILLS_SLIDER = { min: 0, max: 60, step: 5 };

/** Slider value → filter value: the top of the track means no limit */
export const sliderLimit = (value: number, slider: { max: number }): number | null => (value >= slider.max ? null : value);

/** Flats matching every filter */
export function filterFlats(flats: Flat[], f: FlatFilters): Flat[] {
  return flats.filter(
    (flat) =>
      (f.maxRent === null || flat.price <= f.maxRent) &&
      (f.maxBills === null || flat.bills <= f.maxBills) &&
      flat.beds >= f.minBeds &&
      (f.furnished === "Any" || flat.furnished === f.furnished) &&
      (f.toilet === "Any" || /ensuite/i.test(flat.toilet) === (f.toilet === "Ensuite")) &&
      (f.maxMates === null || flat.members <= f.maxMates),
  );
}

/** One removable map chip per active filter; `clear` resets just that filter */
export function activeFlatFilters(f: FlatFilters): { label: string; clear: Partial<FlatFilters> }[] {
  const chips: { label: string; clear: Partial<FlatFilters> }[] = [];
  if (f.maxRent !== null) chips.push({ label: `≤ $${f.maxRent}/wk`, clear: { maxRent: null } });
  if (f.maxBills !== null) chips.push({ label: `Bills ≤ $${f.maxBills}`, clear: { maxBills: null } });
  if (f.minBeds) chips.push({ label: `${f.minBeds}+ bed`, clear: { minBeds: 0 } });
  if (f.furnished !== "Any") chips.push({ label: f.furnished, clear: { furnished: "Any" } });
  if (f.toilet !== "Any") chips.push({ label: `${f.toilet} toilet`, clear: { toilet: "Any" } });
  if (f.maxMates !== null) chips.push({ label: `≤ ${f.maxMates} flatmate${f.maxMates === 1 ? "" : "s"}`, clear: { maxMates: null } });
  return chips;
}

/** Badge on the Filters button and chip */
export const countFlatFilters = (f: FlatFilters): number => activeFlatFilters(f).length;

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
