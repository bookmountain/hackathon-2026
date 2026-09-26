import { StyleSheet, View } from "react-native";
import type { MapPoint } from "@/data/types";
import { colors } from "@/theme";
import MapMarker from "./MapMarker";

type Props = MapPoint & {
  color?: string;
  /** Diameter of the soft ring around the dot; 0 hides it */
  halo?: number;
  haloOpacity?: number;
  /** Diameter of the dot */
  size?: number;
  stroke?: string;
  strokeWidth?: number;
};

// Small location dot for MiniMap: a dropped pin, a pickup point or an event
export default function MapDot({
  latitude,
  longitude,
  color = colors.brand,
  halo = 32,
  haloOpacity = 0.2,
  size = 14,
  stroke = colors.surface,
  strokeWidth = 3,
}: Props) {
  const box = Math.max(halo, size);
  return (
    <MapMarker coordinate={{ latitude, longitude }}>
      <View pointerEvents="none" style={[styles.box, { width: box, height: box }]}>
        {halo > 0 && (
          <View
            style={{ position: "absolute", width: halo, height: halo, borderRadius: halo / 2, backgroundColor: color, opacity: haloOpacity }}
          />
        )}
        <View
          style={{
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: color,
            borderColor: stroke,
            borderWidth: strokeWidth,
          }}
        />
      </View>
    </MapMarker>
  );
}

const styles = StyleSheet.create({
  box: { alignItems: "center", justifyContent: "center" },
});
