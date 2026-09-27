import type { ReactNode, Ref } from "react";
import { StyleSheet, View } from "react-native";
import MapView from "react-native-maps";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CBD_REGION } from "./geometry";
import YouMarker from "./YouMarker";

type Props = {
  /** Pins (use <MapMarker>) */
  children?: ReactNode;
  /** Tapping empty map, e.g. to close the bottom sheet */
  onBackgroundPress?: () => void;
  /** Floating UI over the map (search, chips, buttons, sheet) */
  overlay?: ReactNode;
  /** For recentering (animateToRegion) */
  ref?: Ref<MapView>;
};

/** Search bar + chip row at the top, buttons at the bottom */
const CHROME_TOP = 112;
const CHROME_BOTTOM = 80;

// Full-bleed map of the CBD campuses: Apple Maps on iOS, Google Maps on Android.
// Pinch to zoom, drag to pan.
export default function CampusMap({ children, onBackgroundPress, overlay, ref }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <View style={styles.viewport}>
      <MapView
        ref={ref}
        style={StyleSheet.absoluteFill}
        initialRegion={CBD_REGION}
        rotateEnabled={false}
        pitchEnabled={false}
        toolbarEnabled={false}
        showsCompass={false}
        // Keep pins clear of the floating search, chips and buttons
        mapPadding={{ top: insets.top + CHROME_TOP, right: 0, bottom: CHROME_BOTTOM, left: 0 }}
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
