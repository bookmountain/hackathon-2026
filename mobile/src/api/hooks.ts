import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { useToast } from "@/components/feedback/Toast";
import { errorMessage } from "./client";

/**
 * Reloads a tab's data each time the screen comes into focus (image URLs expire,
 * other students post). `refresh` is for pull-to-refresh. Failures show a toast.
 */
export function useRefreshOnFocus(load: () => Promise<void>) {
  const toast = useToast();
  const [refreshing, setRefreshing] = useState(false);

  const run = useCallback(
    async (pulled: boolean) => {
      if (pulled) setRefreshing(true);
      try {
        await load();
      } catch (e) {
        toast(errorMessage(e));
      } finally {
        if (pulled) setRefreshing(false);
      }
    },
    [load, toast],
  );

  useFocusEffect(
    useCallback(() => {
      void run(false);
    }, [run]),
  );

  return { refreshing, refresh: () => run(true) };
}

/** Fetches one resource for a detail screen; `reload` fetches it again */
export function useLoad<T>(load: () => Promise<T>, key: string) {
  const [state, setState] = useState<{ key: string; data?: T; error?: string }>({ key });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    load().then(
      (data) => active && setState({ key, data }),
      (e) => active && setState({ key, error: errorMessage(e) }),
    );
    return () => {
      active = false;
    };
    // `key` identifies the resource; `load` is a new closure every render
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, attempt]);

  // Ignore a result left over from the previous key
  const current = state.key === key ? state : { key };
  return { data: current.data, error: current.error, reload: () => setAttempt((a) => a + 1) };
}

/** Runs a form action once at a time; failures show the API's message in a toast */
export function useSubmit() {
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const submit = async (action: () => Promise<void>) => {
    if (busy) return;
    setBusy(true);
    try {
      await action();
    } catch (e) {
      toast(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };
  return { busy, submit };
}
