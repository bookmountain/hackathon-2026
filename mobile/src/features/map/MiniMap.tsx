import type { ReactNode } from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import MapView, { type Region } from "react-native-maps";
import type { MapPoint } from "@/data/types";
import { colors, font } from "@/theme";

type Props = {
  region: Region;
  /** Dots and pins (<MapDot>) */
  children?: ReactNode;
  /** Makes the map a picker: pan/zoom enabled, tapping reports the coordinate */
  onPressPoint?: (point: MapPoint) => void;
  /** Floating instruction in the top-left corner ("Tap to pin the exact spot") */
  label?: string;
  footer?: ReactNode;
  /** Width / height of the map area */
  aspectRatio?: number;
};

// Small embedded map: a static preview on detail screens, or a tap-to-pin picker in forms
export default function MiniMap({ region, children, onPressPoint, label, footer, aspectRatio = 2 }: Props) {
  const picker = !!onPressPoint;
  return (
    <View style={styles.frame}>
      <View style={{ aspectRatio }}>
        <MapView
          style={StyleSheet.absoluteFill}
          initialRegion={region}
          scrollEnabled={picker}
          zoomEnabled={picker}
          rotateEnabled={false}
          pitchEnabled={false}
          toolbarEnabled={false}
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
  frame: { borderRadius: 16, overflow: "hidden", borderWidth: 1.5, borderColor: colors.lineSoft },
  label: {
    position: "absolute",
    left: 10,
    top: 10,
    backgroundColor: colors.surface,
    borderRadius: 10,
    paddingHorizontal: 9,
    paddingVertical: 5,
    shadowColor: colors.ink,
    shadowOpacity: 0.12,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  labelText: { color: colors.ink, ...font(700, 11.5) },
});
