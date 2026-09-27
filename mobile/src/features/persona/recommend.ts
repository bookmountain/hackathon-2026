// "Recommended for you" (Meetups) and "Picked for you" (Market), scored from the
// persona the same way as the design
import type { EventCategory, Item, ItemCategory, MeetupEvent } from "@/data/types";
import type { GoalKey, Interest } from "./constants";
import { goalTitle, type Persona } from "./logic";

/** The meetup type each interest leans towards */
export const INTEREST_EVENT_TYPE: Record<Interest, EventCategory> = {
  Coffee: "Casual",
  Gym: "Casual",
  Gaming: "Social",
  Music: "Social",
  Cooking: "Food",
  Hiking: "Casual",
  Anime: "Social",
  Football: "Casual",
  "Study groups": "Study",
  Photography: "Casual",
  Startups: "Study",
  Volunteering: "Social",
  Languages: "Study",
  Art: "Social",
  Movies: "Social",
  Dancing: "Social",
};

/** Meetup types that serve each goal */
export const GOAL_EVENT_TYPES: Record<GoalKey, EventCategory[]> = {
  study: ["Study"],
  friends: ["Social", "Casual"],
  explore: ["Casual", "Food"],
  flat: ["Social"],
  market: [],
};

/** Market categories for the interests that have one */
export const INTEREST_ITEM_CATEGORY: Partial<Record<Interest, ItemCategory>> = {
  Cooking: "Kitchen",
  Gym: "Study gear",
  Hiking: "Study gear",
  "Study groups": "Textbooks",
  Gaming: "Tech",
  Photography: "Tech",
  Music: "Tech",
};

const MAX_PICKS = 4;

export type EventPick<E extends MeetupEvent = MeetupEvent> = { event: E; score: number; reason: string };

/**
 * Score one event: +2 per interest whose type matches, +2 per interest named in
 * the title or description, +1 per goal whose types include it, and +1 for a
 * Study event that already scored (for your major). The reason comes from the
 * first type match or goal, but naming an interest in the text always wins.
 */
export function scoreEvent(event: MeetupEvent & { desc?: string }, persona: Persona, major: string): EventPick {
  let score = 0;
  let reason = "";
  const text = `${event.title} ${event.desc ?? ""}`.toLowerCase();
  for (const i of persona.interests) {
    if (INTEREST_EVENT_TYPE[i] === event.cat) {
      score += 2;
      reason ||= `Because you like ${i}`;
    }
    // "Study groups" also matches "study group"
    if (text.includes(i.toLowerCase().replace(/s$/, ""))) {
      score += 2;
      reason = `Because you like ${i}`;
    }
  }
  for (const g of persona.goals) {
    if (GOAL_EVENT_TYPES[g].includes(event.cat)) {
      score += 1;
      reason ||= `For your goal: ${goalTitle(g)}`;
    }
  }
  if (event.cat === "Study" && major && score > 0) {
    score += 1;
    reason ||= `For ${major} students`;
  }
  return { event, score, reason };
}

/** Up to four events you haven't joined, best first; nothing scores without a persona */
export function recommendEvents<E extends MeetupEvent & { desc?: string }>(
  events: E[],
  persona: Persona,
  major: string,
): EventPick<E>[] {
  return events
    .filter((e) => !e.joined)
    .map((e) => ({ ...scoreEvent(e, persona, major), event: e }))
    .filter((p) => p.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_PICKS);
}

/** The first four unsold items in a category your interests point to */
export function recommendItems(items: Item[], persona: Persona): Item[] {
  const wanted = new Set(persona.interests.map((i) => INTEREST_ITEM_CATEGORY[i]).filter(Boolean));
  if (!wanted.size) return [];
  return items.filter((i) => i.avail !== "Sold" && wanted.has(i.cat)).slice(0, MAX_PICKS);
}
