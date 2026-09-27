import { StyleSheet, View } from "react-native";
import { colors } from "@/theme";
import { YOU } from "./geometry";
import MapMarker from "./MapMarker";

const DOT = 20;
const HALO = 48;

// Blue "you" dot with a soft halo. Static on purpose: marker views are
// snapshotted on Android, so the design's pulse wouldn't play.
export default function YouMarker() {
  return (
    <MapMarker coordinate={YOU} zIndex={4}>
      <View pointerEvents="none" style={styles.box}>
        <View style={styles.halo} />
        <View style={styles.dot} />
      </View>
    </MapMarker>
  );
}

const styles = StyleSheet.create({
  box: { width: HALO, height: HALO, alignItems: "center", justifyContent: "center" },
  halo: {
    position: "absolute",
    width: HALO,
    height: HALO,
    borderRadius: HALO / 2,
    backgroundColor: "rgba(42,68,232,0.18)",
  },
  dot: {
    width: DOT,
    height: DOT,
    borderRadius: DOT / 2,
    backgroundColor: colors.pinBlue,
    borderWidth: 3,
    borderColor: colors.surface,
    boxShadow: "0 1px 4px rgba(0,0,0,0.35)",
  },
});
