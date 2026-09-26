import type { Item, ItemCategory, MapPoint } from "@/data/types";
import { dayMonth } from "@/lib/dates";
import { colors } from "@/theme";

export const CATEGORIES = ["All", "Textbooks", "Tech", "Furniture", "Kitchen", "Study gear"] as const;
export type CategoryFilter = (typeof CATEGORIES)[number];

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
  return items.filter((i) => i.loc === pickupId && !isSold(i) && inCategory(i, category));
}

/** Unsold items at a seller's own pin, shown as price tags on the map */
export function customPinItems(items: Item[], category: CategoryFilter): (Item & { loc: MapPoint & { name: string } })[] {
  return items.filter(
    (i): i is Item & { loc: MapPoint & { name: string } } =>
      typeof i.loc !== "string" && !isSold(i) && inCategory(i, category),
  );
}

/** Badge colours per availability */
export function availabilityColors(avail: string): { bg: string; fg: string } {
  if (avail === "Sold") return { bg: colors.soldSoft, fg: colors.muted };
  if (avail === "Pending") return { bg: colors.yellowSoft, fg: colors.yellowInk };
  return { bg: colors.brandSofter, fg: colors.brandDeep };
}

/** Short badge text for grid cards: "Available from 1 Oct" → "From 1 Oct" */
export function availabilityShort(avail: string): string {
  return avail.replace("Available from", "From");
}

/** "Hi! Is the calculus textbook still available?" */
export function openingMessage(item: Item): string {
  return `Hi! Is the ${item.title.split(" (")[0].toLowerCase()} still available?`;
}

export type Availability = "Available now" | "Available from" | "Pending";

export type ItemDraft = {
  photo: boolean;
  title: string;
  price: string;
  desc: string;
  avail: Availability;
  from: Date | null;
  /** A safe pickup id, or "custom" with a pin */
  pickup: string;
  pin: MapPoint | null;
};

export const EMPTY_ITEM: ItemDraft = {
  photo: false,
  title: "",
  price: "",
  desc: "",
  avail: "Available now",
  from: null,
  pickup: "bsl",
  pin: null,
};

export function itemProblem(draft: ItemDraft): string | null {
  return draft.photo && draft.title.trim() && draft.price ? null : "Add a photo, title and price";
}

export function buildItem(draft: ItemDraft, id: string): Item {
  const cat: ItemCategory = "Study gear";
  return {
    id,
    title: draft.title.trim(),
    price: Number(draft.price),
    avail: draft.avail === "Available from" ? `Available from ${draft.from ? dayMonth(draft.from) : "soon"}` : draft.avail,
    cond: "Good",
    cat,
    loc: draft.pickup === "custom" && draft.pin ? { name: "Your pinned spot", ...draft.pin } : draft.pickup,
    seller: "me",
    posted: "Just now",
    desc: draft.desc.trim() || "No description yet.",
    tone: "#DCE6FF",
  };
}
