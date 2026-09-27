import type { StickerName } from "@/components/ui/stickers";

// Sticker pop-ups from the v6 design: a sticker and a speech bubble that bounce in
// top-right for a moment after good news or a tab switch

export type Pop = { sticker: StickerName; text: string };

export const POPS: Pop[] = [
  { sticker: "sun", text: "Arvo meetup?" },
  { sticker: "roo", text: "Hop in, new flatmate!" },
  { sticker: "pie", text: "Heaps good bargains!" },
  { sticker: "koala", text: "G'day, mate!" },
  { sticker: "cross", text: "Uni mates, sorted" },
  { sticker: "thongs", text: "No worries!" },
  { sticker: "surf", text: "Stoked to meet ya!" },
];

const popFor = (sticker: StickerName) => POPS.find((p) => p.sticker === sticker)!;

/** Switching to a tab greets you with its sticker */
export const TAB_POPS: Record<string, Pop> = {
  meetups: popFor("sun"),
  flats: popFor("roo"),
  market: popFor("pie"),
};

const GOOD_NEWS = /welcome|listed|published|found|you're in|joined|connected|sent|saved/i;
// The design only matches the words above; this keeps errors like "Not found" or "Couldn't send" quiet
const BAD_NEWS = /\b(no|not|couldn't|can't|cannot|failed|error)\b/i;

/** Toasts that celebrate something get a random sticker pop too */
export function celebrates(toast: string): boolean {
  return GOOD_NEWS.test(toast) && !BAD_NEWS.test(toast);
}

export function randomPop(random: () => number = Math.random): Pop {
  return POPS[Math.floor(random() * POPS.length)];
}
