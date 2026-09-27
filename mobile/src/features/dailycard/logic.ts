// Daily card rules, kept pure so they can be tested: one draw a day, a fresh deck
// at local midnight, and a 48-hour lock after a day without drawing.
import type { DailyCardDto, DailyCardStatus } from "@/api/types";
import { toPerson } from "@/data/adapters";
import type { Person } from "@/data/types";

export const LOCK_HOURS = 48;
const DAY_MS = 24 * 60 * 60 * 1000;

/** What the screen and the tab bar badge show */
export type CardView = {
  status: DailyCardStatus;
  match: Person | null;
  drawnToday: number;
  /** When the clock hits zero: next midnight, or the end of the lock */
  nextChangeAt: Date;
};

/** The device's copy while the API has no daily card endpoints */
export type LocalCard = {
  status: DailyCardStatus;
  match: Person | null;
  /** Day of the last draw, "YYYY-MM-DD" in local time */
  lastDrawDay: string | null;
  /** Never deal the same person twice in a row */
  lastMatchId: string | null;
  /** Epoch ms when a missed-day lock ends */
  lockUntil: number | null;
};

export const freshCard: LocalCard = { status: "Ready", match: null, lastDrawDay: null, lastMatchId: null, lockUntil: null };

const pad = (n: number) => String(n).padStart(2, "0");

export function dayKey(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export function nextMidnight(now: Date): Date {
  return new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
}

/** Whole calendar days from `from` ("YYYY-MM-DD") to `now` */
export function daysSince(from: string, now: Date): number {
  const [y, m, d] = from.split("-").map(Number);
  return Math.round((startOfDay(now).getTime() - new Date(y, m - 1, d).getTime()) / DAY_MS);
}

/** "HH:MM:SS", never negative */
export function formatClock(ms: number): string {
  const t = Math.floor(Math.max(0, ms) / 1000);
  return `${pad(Math.floor(t / 3600))}:${pad(Math.floor((t % 3600) / 60))}:${pad(t % 60)}`;
}

/** Bring a stored card up to date: a new day reopens the deck, a skipped day locks it */
export function rollOver(card: LocalCard, now: Date): LocalCard {
  if (card.status === "Missed") {
    if (card.lockUntil !== null && now.getTime() < card.lockUntil) return card;
    // Lock over: a clean start, so the old gap doesn't lock it again
    return { ...freshCard, lastMatchId: card.lastMatchId };
  }
  if (!card.lastDrawDay) return card;
  const gap = daysSince(card.lastDrawDay, now);
  if (gap >= 2) {
    // A whole day went by without a draw
    return { ...card, status: "Missed", match: null, lockUntil: startOfDay(now).getTime() + LOCK_HOURS * 60 * 60 * 1000 };
  }
  if (gap >= 1 && card.status === "Matched") return { ...card, status: "Ready", match: null };
  return card;
}

/** Deal one of `pool` (not the last match when there's a choice) */
export function draw(card: LocalCard, pool: Person[], now: Date, random = Math.random): LocalCard {
  if (card.status !== "Ready" || pool.length === 0) return card;
  const choices = pool.length > 1 ? pool.filter((p) => p.id !== card.lastMatchId) : pool;
  const match = choices[Math.floor(random() * choices.length)];
  return { status: "Matched", match, lastDrawDay: dayKey(now), lastMatchId: match.id, lockUntil: null };
}

/** Demo button: pretend yesterday was skipped */
export function simulateMissed(card: LocalCard, now: Date): LocalCard {
  return { ...card, status: "Missed", match: null, lockUntil: startOfDay(now).getTime() + LOCK_HOURS * 60 * 60 * 1000 };
}

/** A believable "N students have drawn today" for the demo: steady through the day */
export function demoDrawnToday(now: Date, drewToday: boolean): number {
  const key = dayKey(now);
  let hash = 0;
  for (const ch of key) hash = (hash * 31 + ch.charCodeAt(0)) % 997;
  return 120 + (hash % 60) + (drewToday ? 1 : 0);
}

export function localView(card: LocalCard, now: Date): CardView {
  return {
    status: card.status,
    match: card.match,
    drawnToday: demoDrawnToday(now, card.lastDrawDay === dayKey(now)),
    nextChangeAt: card.status === "Missed" && card.lockUntil !== null ? new Date(card.lockUntil) : nextMidnight(now),
  };
}

export function apiView(dto: DailyCardDto): CardView {
  return {
    status: dto.status,
    match: dto.match ? toPerson(dto.match) : null,
    drawnToday: dto.drawnToday,
    nextChangeAt: new Date(dto.nextChangeAt),
  };
}

/** Stand-ins when the app doesn't know any other students yet (they can't be messaged) */
export const DEMO_STUDENTS: Person[] = [
  { id: "demo-p2", nick: "MiaReads", major: "Nursing", uni: "Flinders Uni", avatar: 1 },
  { id: "demo-p3", nick: "ArjunBuilds", major: "Civil Engineering", uni: "Adelaide Uni", avatar: 2 },
  { id: "demo-p4", nick: "lena.l", major: "Psychology", uni: "Flinders Uni", avatar: 4 },
  { id: "demo-p6", nick: "ZoeDesigns", major: "Visual Arts", uni: "Adelaide Uni", avatar: 5 },
  { id: "demo-p7", nick: "hana_k", major: "Law", uni: "Flinders Uni", avatar: 6 },
];

export const isDemoStudent = (p: Person) => p.id.startsWith("demo-");
