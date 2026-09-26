import { StyleSheet, Text, View } from "react-native";
import { colors, font } from "@/theme";
import { YOU } from "./geometry";
import MapMarker from "./MapMarker";

const DOT = 22;
const HALO = 44;
/** The marker is centred on its coordinate, so the box is wide enough for the label on both sides */
const BOX_WIDTH = 120;

// Yellow "You" dot with a soft halo and a label to the lower right.
// Static on purpose: marker views are snapshotted on Android, so animations wouldn't play.
export default function YouMarker() {
  return (
    <MapMarker coordinate={YOU} zIndex={5}>
      <View pointerEvents="none" style={styles.box}>
        <View style={styles.halo} />
        <View style={styles.dot} />
        <Text style={styles.label}>You</Text>
      </View>
    </MapMarker>
  );
}

const styles = StyleSheet.create({
  box: { width: BOX_WIDTH, height: HALO + 20, alignItems: "center", justifyContent: "center" },
  halo: {
    position: "absolute",
    width: HALO,
    height: HALO,
    borderRadius: HALO / 2,
    backgroundColor: colors.yellow,
    opacity: 0.3,
  },
  dot: {
    width: DOT,
    height: DOT,
    borderRadius: DOT / 2,
    backgroundColor: colors.yellow,
    borderWidth: 4,
    borderColor: colors.surface,
  },
  label: {
    position: "absolute",
    left: BOX_WIDTH / 2 + 12,
    top: (HALO + 20) / 2 + 8,
    backgroundColor: colors.surface,
    color: colors.ink,
    borderRadius: 6,
    overflow: "hidden",
    paddingHorizontal: 7,
    paddingVertical: 2,
    ...font(800, 10),
  },
});
