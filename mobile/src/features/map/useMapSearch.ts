import { useEffect, useRef, useState } from "react";
import { Keyboard } from "react-native";
import type MapView from "react-native-maps";
import { onTabSwitch } from "@/features/shell/tabSwitch";
import { MAIN_REGION } from "./geometry";

/** What the bottom sheet shows: search results, or the card of a tapped pin */
export type MapSelection<K extends string> = { kind: "results" } | { kind: K; id: string } | null;

/**
 * The map's search box and bottom sheet. Typing keeps the results sheet open
 * (it updates live) and closes a pin's card; switching tabs clears both.
 * Also holds the map ref for the recenter button.
 */
export function useMapSearch<K extends string>() {
  const [query, setQueryState] = useState("");
  const [sheet, setSheet] = useState<MapSelection<K>>(null);
  const mapRef = useRef<MapView>(null);

  useEffect(
    () =>
      onTabSwitch(() => {
        setQueryState("");
        setSheet(null);
      }),
    [],
  );

  return {
    /** Pass to <CampusMap ref> */
    mapRef,
    /** Back to the opening view, sheet closed */
    recenter: () => {
      setSheet(null);
      mapRef.current?.animateToRegion(MAIN_REGION, 400);
    },
    query,
    sheet,
    setSheet,
    setQuery: (q: string) => {
      setQueryState(q);
      if (q) setSheet((s) => (s?.kind === "results" ? s : null));
    },
    showResults: () => {
      Keyboard.dismiss();
      setSheet({ kind: "results" });
    },
    /** The open pin's id when it is of this kind */
    selected: (kind: K) => (sheet && sheet.kind === kind ? (sheet as { id: string }).id : null),
  };
}
