import type { LocalPhoto } from "@/api/photos";
import type { ItemAvailability, ItemCategoryValue, ItemCondition, ItemRequest } from "@/api/types";
import type { Item, MapPoint } from "@/data/types";
import { toDateOnly } from "@/lib/dates";
import { colors } from "@/theme";

export const CATEGORIES = ["All", "Textbooks", "Tech", "Furniture", "Kitchen", "Study gear"] as const;
export type CategoryFilter = (typeof CATEGORIES)[number];

/** Sell form choices, as GET /api/items/options lists them */
export const CATEGORY_OPTIONS: { value: ItemCategoryValue; label: string }[] = [
  { value: "Textbooks", label: "Textbooks" },
  { value: "Tech", label: "Tech" },
  { value: "Furniture", label: "Furniture" },
  { value: "Kitchen", label: "Kitchen" },
  { value: "StudyGear", label: "Study gear" },
];

export const CONDITION_OPTIONS: { value: ItemCondition; label: string }[] = [
  { value: "New", label: "New" },
  { value: "LikeNew", label: "Like new" },
  { value: "Excellent", label: "Excellent" },
  { value: "Good", label: "Good" },
  { value: "Fair", label: "Fair" },
];

export const MAX_ITEM_PHOTOS = 5;
export const MAX_PRICE = 10_000;

export const isSold = (item: Item) => item.avail === "Sold";

export function inCategory(item: Item, category: CategoryFilter): boolean {
  return category === "All" || item.cat === category;
}

/** Grid: every item in the category (sold ones stay visible, faded) matching the search */
export function listItems(items: Item[], category: CategoryFilter, query = ""): Item[] {
  const q = query.trim().toLowerCase();
  return items.filter((i) => inCategory(i, category) && (!q || i.title.toLowerCase().includes(q)));
}

/** Unsold items waiting at a safe pickup point (the number on its pin) */
export function itemsAtPickup(items: Item[], pickupId: string, category: CategoryFilter = "All"): Item[] {
  return items.filter((i) => i.loc.pickupId === pickupId && !isSold(i) && inCategory(i, category));
}

/** Unsold items at a seller's own pin, shown as price tags on the map */
export function customPinItems(items: Item[], category: CategoryFilter): Item[] {
  return items.filter((i) => i.loc.pickupId === null && !isSold(i) && inCategory(i, category));
}

/** Badge colours per availability */
export function availabilityColors(avail: string): { bg: string; fg: string } {
  if (avail === "Sold") return { bg: colors.soldSoft, fg: colors.muted };
  if (avail === "Pending") return { bg: colors.yellowSoft, fg: colors.yellowInk };
  return { bg: colors.yellow, fg: colors.brandDeep };
}

/** Short badge text for grid cards: "Available from 1 Oct" → "From 1 Oct" */
export function availabilityShort(avail: string): string {
  return avail.replace("Available from", "From");
}

/** "Hi! Is the calculus textbook still available?" */
export function openingMessage(item: Item): string {
  return `Hi! Is the ${item.title.split(" (")[0].toLowerCase()} still available?`;
}

/** The availability a seller can pick when posting (Sold comes later) */
export type Availability = Exclude<ItemAvailability, "Sold">;

export type ItemDraft = {
  photos: LocalPhoto[];
  title: string;
  price: string;
  desc: string;
  category: ItemCategoryValue | null;
  condition: ItemCondition | null;
  avail: Availability;
  from: Date | null;
  /** A safe pickup id, or "custom" with a pin */
  pickup: string;
  pin: MapPoint | null;
  placeName: string;
};

export const EMPTY_ITEM: ItemDraft = {
  photos: [],
  title: "",
  price: "",
  desc: "",
  category: null,
  condition: null,
  avail: "Now",
  from: null,
  pickup: "barr-smith-library",
  pin: null,
  placeName: "",
};

export function itemProblem(draft: ItemDraft, today: Date = new Date()): string | null {
  if (!draft.photos.length || !draft.title.trim() || !draft.price) return "Add a photo, title and price";
  if (Number(draft.price) > MAX_PRICE) return `Keep the price under $${MAX_PRICE.toLocaleString("en-AU")}`;
  if (!draft.category || !draft.condition) return "Pick a category and condition";
  if (draft.avail === "From" && (!draft.from || toDateOnly(draft.from) <= toDateOnly(today)))
    return "Pick a date after today";
  if (draft.pickup === "custom" && !draft.pin) return "Drop your pin on the map";
  return null;
}

/** POST /api/items body; `id` and `photoKeys` come from the photo upload */
export function itemRequest(draft: ItemDraft, id: string, photoKeys: string[]): ItemRequest {
  const ownPin = draft.pickup === "custom" ? draft.pin : null;
  return {
    id,
    title: draft.title.trim(),
    price: Number(draft.price),
    description: draft.desc.trim() || null,
    category: draft.category ?? "StudyGear",
    condition: draft.condition ?? "Good",
    conditionNote: null,
    availability: draft.avail,
    availableFrom: draft.avail === "From" && draft.from ? toDateOnly(draft.from) : null,
    pickupPointId: ownPin ? null : draft.pickup,
    placeName: ownPin ? draft.placeName.trim() || null : null,
    lat: ownPin?.latitude ?? null,
    lng: ownPin?.longitude ?? null,
    photoKeys,
  };
}
