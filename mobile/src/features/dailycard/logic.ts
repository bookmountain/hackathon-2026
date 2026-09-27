// Daily card rules, kept pure so they can be tested: one draw a day and a fresh deck at
// local midnight. After a day without drawing, the next Draw deals nothing: it locks the
// deck until midnight, which starts a new session. The API uses the same rules.
import type { DailyCardDto, DailyCardStatus } from "@/api/types";
import { toPerson } from "@/data/adapters";
import type { Person } from "@/data/types";

const DAY_MS = 24 * 60 * 60 * 1000;

/** What the screen and the tab bar badge show */
export type CardView = {
  status: DailyCardStatus;
  match: Person | null;
  drawnToday: number;
  /** When the clock hits zero: the next midnight */
  nextChangeAt: Date;
  /** Ready, but yesterday went by without a draw: Draw will lock the deck until midnight */
  missedDay: boolean;
  /** The API's id for today's match, to open the chat with (null on the device copy) */
  drawId: string | null;
};

/** The device's copy while the API has no daily card endpoints */
export type LocalCard = {
  status: DailyCardStatus;
  match: Person | null;
  /** Last day Draw was pressed (a match, or a missed-day lock), "YYYY-MM-DD" in local time */
  lastDrawDay: string | null;
  /** Never deal the same person twice in a row */
  lastMatchId: string | null;
  /** Epoch ms when a missed-day lock ends (the midnight after it started) */
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

/** True when yesterday went by without pressing Draw (a brand-new deck never has missed a day) */
export function missedDay(card: LocalCard, now: Date): boolean {
  return card.status === "Ready" && card.lastDrawDay !== null && daysSince(card.lastDrawDay, now) >= 2;
}

/** Bring a stored card up to date: midnight ends today's match or lock */
export function rollOver(card: LocalCard, now: Date): LocalCard {
  if (card.status === "Missed") {
    if (card.lockUntil !== null && now.getTime() < card.lockUntil) return card;
    // Keep lastDrawDay: the lock counts as that day's draw, so today isn't a missed day
    return { ...card, status: "Ready", match: null, lockUntil: null };
  }
  if (card.status === "Matched" && card.lastDrawDay && daysSince(card.lastDrawDay, now) >= 1) {
    return { ...card, status: "Ready", match: null };
  }
  return card;
}

/**
 * Deal one of `pool` (not the last match when there's a choice). After a missed day it deals
 * nothing and locks the deck until midnight instead.
 */
export function draw(card: LocalCard, pool: Person[], now: Date, random = Math.random): LocalCard {
  if (card.status !== "Ready") return card;
  if (missedDay(card, now)) {
    return { ...card, status: "Missed", match: null, lastDrawDay: dayKey(now), lockUntil: nextMidnight(now).getTime() };
  }
  if (pool.length === 0) return card;
  const choices = pool.length > 1 ? pool.filter((p) => p.id !== card.lastMatchId) : pool;
  const match = choices[Math.floor(random() * choices.length)];
  return { status: "Matched", match, lastDrawDay: dayKey(now), lastMatchId: match.id, lockUntil: null };
}

/** Demo button: pretend yesterday went by without a draw, so the next Draw locks the deck */
export function simulateMissed(card: LocalCard, now: Date): LocalCard {
  const twoDaysAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 2);
  return { ...card, status: "Ready", match: null, lastDrawDay: dayKey(twoDaysAgo), lockUntil: null };
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
    drawnToday: demoDrawnToday(now, card.status === "Matched" && card.lastDrawDay === dayKey(now)),
    nextChangeAt: nextMidnight(now),
    missedDay: missedDay(card, now),
    drawId: null,
  };
}

export function apiView(dto: DailyCardDto): CardView {
  return {
    status: dto.status,
    match: dto.match ? toPerson(dto.match) : null,
    drawnToday: dto.drawnToday,
    nextChangeAt: new Date(dto.nextChangeAt),
    missedDay: dto.missedDay,
    drawId: dto.drawId,
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
