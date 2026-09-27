// Daily card state shared by the screen and the tab bar badge. Uses the API's
// /api/daily-card when it exists; until then a demo copy lives on the device.
import * as SecureStore from "expo-secure-store";
import { useEffect, useSyncExternalStore } from "react";
import { isNotBuilt } from "@/api/client";
import * as api from "@/api/endpoints";
import type { Person } from "@/data/types";
import { useAppStore } from "@/store";
import {
  apiView,
  draw,
  freshCard,
  localView,
  rollOver,
  simulateMissed,
  type CardView,
  type LocalCard,
} from "./logic";

/** How long the shuffle plays before the card flips */
export const SHUFFLE_MS = 2400;

type Snapshot = {
  userId: string | null;
  /** "api" once the endpoint answered, "local" when it isn't built yet */
  mode: "api" | "local" | null;
  view: CardView | null;
  spinning: boolean;
};

let snapshot: Snapshot = { userId: null, mode: null, view: null, spinning: false };
let local: LocalCard = freshCard;
let loading: Promise<void> | null = null;
const listeners = new Set<() => void>();

function set(change: Partial<Snapshot>) {
  snapshot = { ...snapshot, ...change };
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

const storeKey = (userId: string) => `ucompass.dailyCard.${userId}`;

async function readLocal(userId: string): Promise<LocalCard> {
  try {
    const raw = await SecureStore.getItemAsync(storeKey(userId));
    return raw ? { ...freshCard, ...(JSON.parse(raw) as LocalCard) } : freshCard;
  } catch {
    return freshCard;
  }
}

function saveLocal(card: LocalCard) {
  local = card;
  set({ view: localView(card, new Date()) });
  const userId = snapshot.userId;
  if (userId) SecureStore.setItemAsync(storeKey(userId), JSON.stringify(card)).catch(() => {});
}

/** Load (or re-check after midnight) the card for this account */
export function loadDailyCard(userId: string): Promise<void> {
  if (snapshot.userId !== userId) {
    snapshot = { userId, mode: null, view: null, spinning: false };
    loading = null;
  }
  loading ??= (async () => {
    try {
      const dto = await api.dailyCard.get();
      set({ mode: "api", view: apiView(dto) });
    } catch (e) {
      if (!isNotBuilt(e)) throw e;
      const stored = await readLocal(userId);
      set({ mode: "local" });
      saveLocal(rollOver(stored, new Date()));
    }
  })().finally(() => {
    loading = null;
  });
  return loading;
}

/** Shuffle, then flip to the match. `pool` = students to deal from in demo mode. */
export async function drawDailyCard(pool: Person[]): Promise<void> {
  if (snapshot.view?.status !== "Ready" || snapshot.spinning) return;
  set({ spinning: true });
  const shuffle = new Promise((r) => setTimeout(r, SHUFFLE_MS));
  try {
    if (snapshot.mode === "api") {
      const [dto] = await Promise.all([api.dailyCard.draw(), shuffle]);
      set({ view: apiView(dto) });
    } else {
      await shuffle;
      saveLocal(draw(local, pool, new Date()));
    }
  } finally {
    set({ spinning: false });
  }
}

/** Demo buttons: on the server when it allows a reset (DailyCard__DemoReset), else the device copy */
export const demo = {
  resetToday: async () => {
    if (snapshot.mode === "api") set({ view: apiView(await api.dailyCard.reset()) });
    else saveLocal({ ...freshCard, lastMatchId: local.lastMatchId });
  },
  missDay: async () => {
    if (snapshot.mode === "api") set({ view: apiView(await api.dailyCard.reset(true)) });
    else saveLocal(simulateMissed(local, new Date()));
  },
};

/** The clock ran out: move to the next day's state */
export function refreshAfterClock() {
  if (snapshot.mode === "local") saveLocal(rollOver(local, new Date()));
  else if (snapshot.mode === "api" && snapshot.userId) loadDailyCard(snapshot.userId).catch(() => {});
}

export function useDailyCard(): Snapshot {
  return useSyncExternalStore(subscribe, () => snapshot);
}

/** True when today's card can still be drawn (the tab bar's orange badge) */
export function useDailyCardReady(): boolean {
  const { state } = useAppStore();
  const userId = state.session.me?.userId ?? null;
  const card = useDailyCard();
  useEffect(() => {
    if (userId && card.userId !== userId) loadDailyCard(userId).catch(() => {});
  }, [userId, card.userId]);
  return card.userId === userId && card.view?.status === "Ready" && !card.spinning;
}
