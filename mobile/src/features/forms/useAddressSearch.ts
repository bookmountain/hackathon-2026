import { useCallback, useEffect, useRef, useState } from "react";
import { geocode, GEOCODE_DELAY_MS, geocodeQuery, type GeocodeResult } from "./geocode";

export type AddressStatus = { tone: "ok" | "error"; text: string } | null;

/**
 * Type an address, get it pinned: looks it up after a pause in typing, pins the
 * first match automatically (`onPin`) and offers the others to pick from.
 */
export function useAddressSearch(onPin: (result: GeocodeResult) => void) {
  const [text, setTextState] = useState("");
  const [results, setResults] = useState<GeocodeResult[]>([]);
  const [selected, setSelected] = useState(0);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<AddressStatus>(null);
  const latest = useRef(0);
  const pinRef = useRef(onPin);
  useEffect(() => {
    pinRef.current = onPin;
  });

  const setText = useCallback((value: string) => {
    setTextState(value);
    if (!geocodeQuery(value)) {
      // Too short to look up: drop the old matches and any lookup in flight
      latest.current++;
      setResults([]);
      setStatus(null);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!geocodeQuery(text)) return;
    const id = ++latest.current;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const found = await geocode(text, controller.signal);
        if (id !== latest.current) return;
        setResults(found);
        setSelected(0);
        if (found.length) {
          pinRef.current(found[0]);
          setStatus({ tone: "ok", text: "Pinned automatically. Not quite right? Pick another match or tap the map." });
        } else {
          setStatus({ tone: "error", text: "Couldn't find that address. Tap the map to drop a pin instead." });
        }
      } catch {
        if (id === latest.current) {
          setResults([]);
          setStatus({ tone: "error", text: "Address lookup unavailable right now. Tap the map to drop a pin." });
        }
      } finally {
        if (id === latest.current) setLoading(false);
      }
    }, GEOCODE_DELAY_MS);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [text]);

  const pick = useCallback(
    (index: number) => {
      const result = results[index];
      if (!result) return;
      setSelected(index);
      pinRef.current(result);
      setStatus({ tone: "ok", text: "Pinned automatically. Not quite right? Pick another match or tap the map." });
    },
    [results],
  );

  /** The user tapped the map instead */
  const mapTapped = useCallback(() => {
    setSelected(-1);
    setStatus({ tone: "ok", text: "Pinned where you tapped on the map." });
  }, []);

  return { text, setText, results, selected, loading, status, pick, mapTapped };
}

export type AddressSearch = ReturnType<typeof useAddressSearch>;
