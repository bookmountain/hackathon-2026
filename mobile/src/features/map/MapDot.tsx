import { StyleSheet, View } from "react-native";
import type { MapPoint } from "@/data/types";
import { colors } from "@/theme";
import MapMarker from "./MapMarker";

/** The design's small map markers: a dropped pin, an event pin, or a pickup-point dot */
export type MapDotKind = "pin" | "evpin" | "dot";

type Look = { color: string; halo: number; haloColor: string; haloOpacity: number; size: number; stroke: string; strokeWidth: number };

/** Soft drop shadow under the dot; the event pin has none */
const SHADOW: Record<MapDotKind, string | undefined> = {
  pin: "0 2px 6px rgba(10,26,63,0.35)",
  evpin: undefined,
  dot: "0 2px 6px rgba(10,26,63,0.3)",
};

// The design's map script colours: its own blue halo and a warm yellow ring round events
const KINDS: Record<MapDotKind, Look> = {
  pin: { color: colors.pinBlue, halo: 34, haloColor: "#1F5BFF", haloOpacity: 0.22, size: 16, stroke: colors.surface, strokeWidth: 3 },
  evpin: { color: colors.pinCoral, halo: 34, haloColor: "#FFC940", haloOpacity: 0.4, size: 14, stroke: colors.pinInk, strokeWidth: 2.5 },
  dot: { color: colors.brandLight, halo: 0, haloColor: colors.brandLight, haloOpacity: 0, size: 12, stroke: colors.surface, strokeWidth: 2.5 },
};

type Props = MapPoint & {
  kind?: MapDotKind;
  /** Dots only: the chosen pickup point is bigger and ink */
  selected?: boolean;
  onPress?: () => void;
  label?: string;
  // Overrides of the kind's look
  color?: string;
  /** Diameter of the soft ring around the dot; 0 hides it */
  halo?: number;
  haloOpacity?: number;
  /** Diameter of the dot */
  size?: number;
  stroke?: string;
  strokeWidth?: number;
};

// Small location marker for MiniMap
export default function MapDot({ latitude, longitude, kind = "pin", selected, onPress, label, ...override }: Props) {
  const base = KINDS[kind];
  const look: Look = {
    ...base,
    ...(kind === "dot" && selected ? { color: colors.pinInk, size: 18 } : null),
    ...Object.fromEntries(Object.entries(override).filter(([, v]) => v !== undefined)),
  };
  const haloColor = override.color && kind !== "evpin" ? override.color : look.haloColor;
  const box = Math.max(look.halo, look.size);
  return (
    <MapMarker coordinate={{ latitude, longitude }} onPress={onPress} label={label} zIndex={selected || kind !== "dot" ? 5 : 3}>
      <View pointerEvents="none" style={[styles.box, { width: box, height: box }]}>
        {look.halo > 0 && (
          <View
            style={{
              position: "absolute",
              width: look.halo,
              height: look.halo,
              borderRadius: look.halo / 2,
              backgroundColor: haloColor,
              opacity: look.haloOpacity,
            }}
          />
        )}
        <View
          style={{
            width: look.size,
            height: look.size,
            borderRadius: look.size / 2,
            backgroundColor: look.color,
            borderColor: look.stroke,
            borderWidth: look.strokeWidth,
            boxShadow: SHADOW[kind],
          }}
        />
      </View>
    </MapMarker>
  );
}

const styles = StyleSheet.create({
  box: { alignItems: "center", justifyContent: "center" },
});
