import { useCallback, useEffect, useRef, useState } from "react";
import { ApiError, isNotBuilt } from "@/api/client";
import { jpegBase64 } from "@/api/photos";

export type AnalysisState<T> =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; message: string; canRetry: boolean }
  | { status: "done"; result: T };

const FILL_IN = "Fill in the details yourself.";

/** What to say when analysis fails, and whether trying the same photo again could help */
export function analysisFailure(error: unknown): { message: string; canRetry: boolean } {
  // The endpoint isn't deployed yet, or the server has no Anthropic key
  if (isNotBuilt(error) || (error instanceof ApiError && error.code === "ai_not_configured")) {
    return { message: `AI photo analysis isn't switched on yet. ${FILL_IN}`, canRetry: false };
  }
  // A photo Claude won't describe: another photo might work, the same one won't
  if (error instanceof ApiError && error.status === 422) return { message: error.message, canRetry: false };
  return { message: `Couldn't analyse this photo. ${FILL_IN}`, canRetry: true };
}

/**
 * Sends a photo for AI analysis. Only the latest request counts, so re-picking a
 * photo mid-analysis can't fill the form from the old one. Any failure shows the
 * "fill it in yourself" state, with Retry when trying again could help.
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
    } catch (e) {
      if (id === latest.current) setState({ status: "error", ...analysisFailure(e) });
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
