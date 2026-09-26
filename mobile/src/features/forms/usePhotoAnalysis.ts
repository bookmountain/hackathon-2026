import { useCallback, useEffect, useRef, useState } from "react";
import { jpegBase64 } from "@/api/photos";

export type AnalysisState<T> =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error" }
  | { status: "done"; result: T };

/**
 * Sends a photo for AI analysis. Only the latest request counts, so re-picking a
 * photo mid-analysis can't fill the form from the old one. Any failure (including
 * the endpoint not existing yet) shows the "fill it in yourself" state.
 */
export function usePhotoAnalysis<T>(analyse: (image: string) => Promise<T>, onResult: (result: T) => void) {
  const [state, setState] = useState<AnalysisState<T>>({ status: "idle" });
  const latest = useRef(0);
  const lastUri = useRef<string | null>(null);
  const handlers = useRef({ analyse, onResult });
  useEffect(() => {
    handlers.current = { analyse, onResult };
  });

  const run = useCallback(async (uri: string) => {
    const id = ++latest.current;
    lastUri.current = uri;
    setState({ status: "loading" });
    try {
      const result = await handlers.current.analyse(await jpegBase64(uri));
      if (id !== latest.current) return;
      setState({ status: "done", result });
      handlers.current.onResult(result);
    } catch {
      if (id === latest.current) setState({ status: "error" });
    }
  }, []);

  const retry = useCallback(() => {
    if (lastUri.current) void run(lastUri.current);
  }, [run]);

  const reset = useCallback(() => {
    latest.current++;
    lastUri.current = null;
    setState({ status: "idle" });
  }, []);

  return { state, run, retry, reset };
}
