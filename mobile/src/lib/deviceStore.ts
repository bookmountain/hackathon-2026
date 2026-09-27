// A value kept on the device per account, for things the API has no field for
// (reminders, the persona, study levels). Shared by every screen that reads it.
import * as SecureStore from "expo-secure-store";
import { useEffect, useSyncExternalStore } from "react";

type Snapshot<T> = { userId: string | null; value: T; loaded: boolean };

export type DeviceStore<T> = {
  /** This account's value; `initial` is used when nothing is stored yet */
  useValue: (userId: string | null, initial?: T) => { value: T; loaded: boolean };
  /** Change the signed-in account's value. Changes made while it loads are applied on top of what's stored. */
  update: (change: (value: T) => T) => void;
  /** Switch to an account and load its value (useValue does this); resolves once loaded */
  select: (userId: string, initial?: T) => Promise<void>;
  get: () => Snapshot<T>;
};

/** `name` becomes the SecureStore key `ucompass.<name>.<userId>` (letters, digits, "." "-" "_" only) */
export function deviceStore<T>(name: string, empty: T): DeviceStore<T> {
  let snapshot: Snapshot<T> = { userId: null, value: empty, loaded: false };
  let pending: ((value: T) => T)[] = [];
  const idle = { value: empty, loaded: false };
  const listeners = new Set<() => void>();

  const set = (next: Snapshot<T>) => {
    snapshot = next;
    listeners.forEach((l) => l());
  };
  const subscribe = (listener: () => void) => {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  };
  const key = (userId: string) => `ucompass.${name}.${userId}`;
  const persist = (userId: string, value: T) => {
    SecureStore.setItemAsync(key(userId), JSON.stringify(value)).catch(() => {});
  };

  async function load(userId: string, initial: T) {
    let stored: T | null = null;
    try {
      const raw = await SecureStore.getItemAsync(key(userId));
      stored = raw ? (JSON.parse(raw) as T) : null;
    } catch {
      stored = null;
    }
    if (snapshot.userId !== userId) return;
    const changes = pending;
    pending = [];
    const value = changes.reduce((v, change) => change(v), stored ?? initial);
    set({ userId, value, loaded: true });
    if (changes.length) persist(userId, value);
  }

  function update(change: (value: T) => T) {
    const { userId, value, loaded } = snapshot;
    if (!userId) return;
    set({ userId, value: change(value), loaded });
    if (loaded) persist(userId, snapshot.value);
    else pending.push(change);
  }

  async function select(userId: string, initial: T = empty) {
    if (snapshot.userId === userId) return;
    pending = [];
    set({ userId, value: initial, loaded: false });
    await load(userId, initial);
  }

  function useValue(userId: string | null, initial: T = empty) {
    const snap = useSyncExternalStore(subscribe, () => snapshot);
    useEffect(() => {
      if (userId) select(userId, initial);
    }, [userId, initial]);
    return snap.userId === userId ? snap : idle;
  }

  return { useValue, update, select, get: () => snapshot };
}
