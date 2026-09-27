import { useEffect, useRef, type ReactNode } from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import MapView, { type Region } from "react-native-maps";
import type { MapPoint } from "@/data/types";
import { colors, font } from "@/theme";

/** About Google's zoom 17: a few streets across */
const FOCUS_DELTA = 0.004;

type Props = {
  region: Region;
  /** Dots and pins (<MapDot>) */
  children?: ReactNode;
  /** Makes the map a picker: pan/zoom enabled, tapping reports the coordinate */
  onPressPoint?: (point: MapPoint) => void;
  /** Floating instruction in the top-left corner ("Unknown address? Tap the map to pin it") */
  label?: string;
  footer?: ReactNode;
  /** Width / height of the map area */
  aspectRatio?: number;
  /** Fixed height of the map area instead of an aspect ratio (forms use 220) */
  height?: number;
  /** Zooms in on this point whenever it changes (a pin placed from a typed address) */
  focus?: MapPoint | null;
};

// Small embedded map: a static preview on detail screens, or a tap-to-pin picker in forms
export default function MiniMap({ region, children, onPressPoint, label, footer, aspectRatio = 2, height, focus }: Props) {
  const picker = !!onPressPoint;
  const map = useRef<MapView>(null);
  const focusLat = focus?.latitude;
  const focusLng = focus?.longitude;

  useEffect(() => {
    if (focusLat === undefined || focusLng === undefined) return;
    map.current?.animateToRegion(
      { latitude: focusLat, longitude: focusLng, latitudeDelta: FOCUS_DELTA, longitudeDelta: FOCUS_DELTA },
      400,
    );
  }, [focusLat, focusLng]);

  return (
    <View style={styles.frame}>
      <View style={height ? { height } : { aspectRatio }}>
        <MapView
          ref={map}
          style={StyleSheet.absoluteFill}
          initialRegion={region}
          scrollEnabled={picker}
          zoomEnabled={picker}
          rotateEnabled={false}
          pitchEnabled={false}
          toolbarEnabled={false}
          // The design greys out read-only previews; maps you pin on stay in colour
          mapType={picker ? "standard" : "mutedStandard"}
          // Lite mode renders a cheap static image on Android for previews
          liteMode={!picker && Platform.OS === "android"}
          onPress={picker ? (e) => onPressPoint(e.nativeEvent.coordinate) : undefined}
        >
          {children}
        </MapView>
        {label ? (
          <View pointerEvents="none" style={styles.label}>
            <Text style={styles.labelText}>{label}</Text>
          </View>
        ) : null}
      </View>
      {footer}
    </View>
  );
}

const styles = StyleSheet.create({
  frame: { borderRadius: 18, overflow: "hidden", borderWidth: 2, borderColor: colors.ink, backgroundColor: colors.surface },
  label: {
    position: "absolute",
    left: 10,
    top: 10,
    backgroundColor: colors.surface,
    borderRadius: 10,
    paddingHorizontal: 9,
    paddingVertical: 5,
    boxShadow: "0 2px 6px rgba(20,20,43,0.12)",
  },
  labelText: { color: colors.ink, ...font(700, 11.5) },
});
