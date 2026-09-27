import { useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { errorMessage } from "@/api/client";
import { useToast } from "@/components/feedback/Toast";
import { goBack } from "@/lib/goBack";

/**
 * Edit mode for the Sell, List a room and Host forms: opened with `?editId=…` (and
 * `from=profile` from My activity; saving goes back to wherever editing started).
 * Fetches the entity once and hands it to `fill`; if that fails it toasts and goes back.
 */
export function useEditPrefill<T>(load: (id: string) => Promise<T>, fill: (data: T) => void) {
  const { editId } = useLocalSearchParams<{ editId?: string; from?: string }>();
  const toast = useToast();
  const [loaded, setLoaded] = useState(false);
  // Only the first response fills the form; later renders keep what the user typed
  const callbacks = useRef({ load, fill, toast });
  useEffect(() => {
    callbacks.current = { load, fill, toast };
  });

  useEffect(() => {
    if (!editId) return;
    let active = true;
    callbacks.current.load(editId).then(
      (data) => {
        if (!active) return;
        callbacks.current.fill(data);
        setLoaded(true);
      },
      (e) => {
        if (!active) return;
        callbacks.current.toast(errorMessage(e));
        goBack();
      },
    );
    return () => {
      active = false;
    };
  }, [editId]);

  return { editId: editId || null, editing: !!editId, loading: !!editId && !loaded };
}
