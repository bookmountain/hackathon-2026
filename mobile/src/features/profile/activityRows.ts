// Rows of Profile's "My activity": your meetups, rooms and market listings
import type { Flat, Item, MeetupEvent } from "@/data/types";
import { colors } from "@/theme";

/** Events have no photos; the design uses one generic meetup picture */
export const EVENT_THUMB = "https://images.unsplash.com/photo-1523580494863-6f3031224c94?w=200&h=200&q=60&auto=format&fit=crop";

// Tag colours from the design with no theme token
const HOSTING = { bg: colors.amberSoft, fg: colors.amberInk };
const SOFT_BLUE = { bg: colors.blueTint, fg: colors.brand };
const GREY = { bg: colors.soldSoft, fg: colors.muted };

export type ActivityKind = "event" | "flat" | "item";

export type ActivityRow = {
  kind: ActivityKind;
  id: string;
  title: string;
  sub: string;
  photo: string | null;
  tag: string;
  tagBg: string;
  tagFg: string;
  /** Only your own posts can be edited; events you just joined can only be left */
  canEdit: boolean;
  /** Label of the red confirm button */
  deleteLabel: "Delete" | "Leave";
};

export function eventRow(e: MeetupEvent): ActivityRow {
  const tag = e.host ? HOSTING : SOFT_BLUE;
  return {
    kind: "event",
    id: e.id,
    title: e.title,
    sub: `${e.when} · ${e.where.name}`,
    photo: EVENT_THUMB,
    tag: e.host ? "Hosting" : "Going",
    tagBg: tag.bg,
    tagFg: tag.fg,
    canEdit: e.host,
    deleteLabel: e.host ? "Delete" : "Leave",
  };
}

export function flatRow(f: Flat): ActivityRow {
  const tag = f.taken ? GREY : SOFT_BLUE;
  return {
    kind: "flat",
    id: f.id,
    title: f.title,
    sub: `$${f.price}/wk · ${f.area}`,
    photo: f.photo,
    tag: f.taken ? "Taken" : f.from,
    tagBg: tag.bg,
    tagFg: tag.fg,
    canEdit: true,
    deleteLabel: "Delete",
  };
}

export function itemRow(i: Item): ActivityRow {
  const tag = i.avail === "Sold" ? GREY : SOFT_BLUE;
  return {
    kind: "item",
    id: i.id,
    title: i.title,
    sub: `$${i.price} · ${i.loc.short}`,
    photo: i.photo,
    tag: i.avail,
    tagBg: tag.bg,
    tagFg: tag.fg,
    canEdit: true,
    deleteLabel: "Delete",
  };
}

/** Toast after the confirm button */
export function deletedToast(row: ActivityRow): string {
  if (row.kind === "event") return row.deleteLabel === "Leave" ? `You've left ${row.title}` : "Event deleted";
  return row.kind === "flat" ? "Room deleted" : "Listing deleted";
}

/** The count next to a section title; blank when there's nothing */
export const countLabel = (n: number) => (n ? String(n) : "");
