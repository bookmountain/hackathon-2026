import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import MapView from "react-native-maps";
import { CBD_REGION } from "./geometry";
import YouMarker from "./YouMarker";

type Props = {
  /** Pins (use <MapMarker>) */
  children?: ReactNode;
  /** Tapping empty map, e.g. to close the bottom sheet */
  onBackgroundPress?: () => void;
  /** Floating UI over the map (chips, hint, sheet) */
  overlay?: ReactNode;
};

// Full-screen map of the CBD campuses: Apple Maps on iOS, Google Maps on Android.
// Pinch to zoom, drag to pan.
export default function CampusMap({ children, onBackgroundPress, overlay }: Props) {
  return (
    <View style={styles.viewport}>
      <MapView
        style={StyleSheet.absoluteFill}
        initialRegion={CBD_REGION}
        rotateEnabled={false}
        pitchEnabled={false}
        toolbarEnabled={false}
        showsCompass={false}
        // Leave room for the floating chips and the hint/sheet
        mapPadding={{ top: 48, right: 0, bottom: 56, left: 0 }}
        onPress={(e) => {
          // Android also reports marker taps here
          if (e.nativeEvent.action !== "marker-press") onBackgroundPress?.();
        }}
      >
        {children}
        <YouMarker />
      </MapView>
      {overlay}
    </View>
  );
}

const styles = StyleSheet.create({
  viewport: { flex: 1, overflow: "hidden" },
});
