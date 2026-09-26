import { useState, type ReactNode } from "react";
import { Pressable, StyleSheet, Text, View, type LayoutChangeEvent } from "react-native";
import Svg from "react-native-svg";
import type { MapPoint } from "@/data/types";
import { colors, font } from "@/theme";
import CampusMapArt from "./CampusMapArt";
import { touchToMap, viewBoxString, type ViewBox } from "./geometry";

type Props = {
  viewBox: ViewBox;
  /** SVG shapes drawn over the map in map coordinates (pins, dots) */
  children?: ReactNode;
  /** Makes the map a picker: tapping reports the map point */
  onPressPoint?: (point: MapPoint) => void;
  /** Floating instruction in the top-left corner ("Tap to pin the exact spot") */
  label?: string;
  footer?: ReactNode;
};

// Cropped, static view of the campus map for detail screens and pin pickers
export default function MiniMap({ viewBox, children, onPressPoint, label, footer }: Props) {
  const [size, setSize] = useState({ width: 0, height: 0 });
  const onLayout = (e: LayoutChangeEvent) => setSize(e.nativeEvent.layout);

  const map = (
    <View onLayout={onLayout} style={{ aspectRatio: viewBox.width / viewBox.height }}>
      <Svg width="100%" height="100%" viewBox={viewBoxString(viewBox)}>
        <CampusMapArt />
        {children}
      </Svg>
    </View>
  );

  return (
    <View style={styles.frame}>
      {onPressPoint ? (
        <Pressable
          accessibilityRole="button"
          accessibilityHint="Drops a pin where you tap"
          onPress={(e) => {
            if (!size.width) return;
            onPressPoint(touchToMap({ x: e.nativeEvent.locationX, y: e.nativeEvent.locationY }, size, viewBox));
          }}
        >
          {map}
        </Pressable>
      ) : (
        map
      )}
      {label ? (
        <View pointerEvents="none" style={styles.label}>
          <Text style={styles.labelText}>{label}</Text>
        </View>
      ) : null}
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
