import type { ItemCategoryValue } from "@/api/types";
import type { Item, ItemCategory } from "@/data/types";

// Local stand-in for POST /api/items/image-search until the API has it:
// guess a category from the photo's file name and rank the unsold items.

const NAME_HINTS: [RegExp, ItemCategory][] = [
  [/book|text|novel|calc|note/, "Textbooks"],
  [/lamp|chair|desk|table|shelf|sofa|bed/, "Furniture"],
  [/ipad|tablet|laptop|phone|mac|screen|monitor|head|tech/, "Tech"],
  [/cook|rice|kettle|pan|pot|kitchen|toaster/, "Kitchen"],
  [/lab|coat|glass|calcul|goggle/, "Study gear"],
];

/** "desk-lamp.jpg" → Furniture; null when nothing matches */
export function guessCategory(fileName: string): ItemCategory | null {
  const name = fileName.toLowerCase();
  return NAME_HINTS.find(([re]) => re.test(name))?.[1] ?? null;
}

/** The API's enum value for a category label */
export function categoryOfValue(value: ItemCategoryValue | null): ItemCategory | null {
  if (!value) return null;
  return value === "StudyGear" ? "Study gear" : value;
}

/**
 * Unsold items, the guessed category first (the prototype's scoring: 10 for the
 * category plus a stable 0–4 jitter), top 4 with a guess or 5 without.
 */
export function rankByImage(items: Item[], category: ItemCategory | null): Item[] {
  return items
    .filter((i) => i.avail !== "Sold")
    .map((item, k) => ({
      item,
      score: (category && item.cat === category ? 10 : 0) + (((item.id.charCodeAt(1) || 0) * 7 + k * 3) % 5),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, category ? 4 : 5)
    .map((r) => r.item);
}

/** The status line under "Searching by image" */
export function imageSearchStatus(loading: boolean, category: ItemCategory | null): string {
  if (loading) return "Looking for similar items…";
  return category ? `Looks like: ${category}` : "Closest matches from the marketplace";
}
