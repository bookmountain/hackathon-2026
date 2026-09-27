// How a photo analysis fills in the Sell and "List a room" forms (the design's rules)
import type { Furnishing, ItemCategoryValue, ItemCondition, ItemPhotoAnalysis, RoomPhotoAnalysis } from "@/api/types";
import { FEATURE_OPTIONS } from "@/features/flats/logic";
import { CATEGORY_OPTIONS, CONDITION_OPTIONS } from "@/features/market/logic";

const norm = (s: string) => s.toLowerCase().replace(/[^a-z]/g, "");

/** Accepts the API's value ("LikeNew") or the label ("Like new") */
export function toCategory(value: string | null | undefined): ItemCategoryValue | null {
  if (!value) return null;
  return CATEGORY_OPTIONS.find((c) => norm(c.value) === norm(value) || norm(c.label) === norm(value))?.value ?? null;
}

export function toCondition(value: string | null | undefined): ItemCondition | null {
  if (!value) return null;
  return CONDITION_OPTIONS.find((c) => norm(c.value) === norm(value) || norm(c.label) === norm(value))?.value ?? null;
}

const FURNISHING: Record<string, Furnishing> = {
  fully: "Fully",
  fullyfurnished: "Fully",
  partly: "Partly",
  partlyfurnished: "Partly",
  unfurnished: "Unfurnished",
};

export function toFurnishing(value: string | null | undefined): Furnishing | null {
  return value ? (FURNISHING[norm(value)] ?? null) : null;
}

export const conditionLabel = (c: ItemCondition | null) => CONDITION_OPTIONS.find((o) => o.value === c)?.label ?? "";
export const categoryLabel = (c: ItemCategoryValue | null) => CATEGORY_OPTIONS.find((o) => o.value === c)?.label ?? "";

const bullets = (benefits: string[]) => benefits.slice(0, 3).map((b) => `\n• ${b}`).join("");

type ItemFields = { title: string; price: string; desc: string; category: ItemCategoryValue | null; condition: ItemCondition | null };

/** Title and price only when empty; the description is always rewritten; category and condition set when recognised */
export function itemAutofill(draft: ItemFields, a: ItemPhotoAnalysis): Partial<ItemFields> {
  const category = toCategory(a.category);
  const condition = toCondition(a.condition);
  const price = Math.round(a.suggestedPrice);
  const facts = [`Colour: ${a.colour}`, `Texture: ${a.texture}`, condition ? `Condition: ${conditionLabel(condition)}` : ""]
    .filter((s) => !s.endsWith(": "))
    .join(" · ");
  return {
    ...(draft.title.trim() ? null : { title: a.title.slice(0, 80) }),
    ...(draft.price || !(price >= 0) ? null : { price: String(price) }),
    desc: `${a.description}${facts ? `\n\n${facts}` : ""}${bullets(a.benefits)}`.slice(0, 1000),
    ...(category ? { category } : null),
    ...(condition ? { condition } : null),
  };
}

type RoomFields = { title: string; desc: string; feats: string[]; furnished: Furnishing };

/** Title only when empty; the description is rewritten; spotted features are added; furnishing set when recognised */
export function roomAutofill(room: RoomFields, a: RoomPhotoAnalysis): Partial<RoomFields> {
  const spotted = a.features.filter((f) => FEATURE_OPTIONS.includes(f));
  const furnished = toFurnishing(a.furnished);
  return {
    ...(room.title.trim() ? null : { title: a.title.slice(0, 80) }),
    desc: `${a.description}${bullets(a.benefits)}`.slice(0, 1000),
    feats: [...room.feats, ...spotted.filter((f) => !room.feats.includes(f))],
    ...(furnished ? { furnished } : null),
  };
}
