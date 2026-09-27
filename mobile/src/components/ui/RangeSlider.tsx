import { useRef, useState } from "react";
import { StyleSheet, View, type LayoutChangeEvent } from "react-native";
import { colors } from "@/theme";

type Props = {
  min: number;
  max: number;
  step?: number;
  low: number;
  high: number;
  onChange: (low: number, high: number) => void;
  /** Screen-reader labels, e.g. "Minimum rent" */
  labels?: [string, string];
  format?: (value: number) => string;
};

const THUMB = 28;

// Two-thumb slider for a min–max range; the thumbs can't cross
export default function RangeSlider({ min, max, step = 1, low, high, onChange, labels, format = String }: Props) {
  const [width, setWidth] = useState(0);
  // Where the current drag started: finger position and the thumb's value
  const drag = useRef({ pageX: 0, value: 0 });

  const move = (thumb: "low" | "high", pageX: number) => {
    if (!width) return;
    const raw = drag.current.value + ((pageX - drag.current.pageX) / width) * (max - min);
    const snapped = Math.round((raw - min) / step) * step + min;
    if (thumb === "low") {
      const next = Math.max(min, Math.min(snapped, high - step));
      if (next !== low) onChange(next, high);
    } else {
      const next = Math.min(max, Math.max(snapped, low + step));
      if (next !== high) onChange(low, next);
    }
  };

  const x = (v: number) => (max > min ? ((v - min) / (max - min)) * width : 0);
  const onLayout = (e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width - THUMB);
  const nudge = (thumb: "low" | "high", by: number) => {
    if (thumb === "low") onChange(Math.max(min, Math.min(low + by, high - step)), high);
    else onChange(low, Math.min(max, Math.max(high + by, low + step)));
  };

  return (
    <View style={styles.frame} onLayout={onLayout}>
      <View style={styles.track} />
      <View style={[styles.fill, { left: THUMB / 2 + x(low), width: x(high) - x(low) }]} />
      {(["low", "high"] as const).map((thumb, i) => {
        const value = thumb === "low" ? low : high;
        return (
          <View
            key={thumb}
            onStartShouldSetResponder={() => true}
            onMoveShouldSetResponder={() => true}
            // Keep the drag when the sheet's ScrollView would like it
            onResponderTerminationRequest={() => false}
            onResponderGrant={(e) => {
              drag.current = { pageX: e.nativeEvent.pageX, value };
            }}
            onResponderMove={(e) => move(thumb, e.nativeEvent.pageX)}
            hitSlop={12}
            accessible
            accessibilityRole="adjustable"
            accessibilityLabel={labels?.[i]}
            accessibilityValue={{ text: format(value) }}
            accessibilityActions={[{ name: "increment" }, { name: "decrement" }]}
            onAccessibilityAction={(e) => nudge(thumb, e.nativeEvent.actionName === "increment" ? step : -step)}
            style={[styles.thumb, { left: x(value) }]}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  frame: { height: THUMB + 8, justifyContent: "center" },
  track: { position: "absolute", left: THUMB / 2, right: THUMB / 2, height: 6, borderRadius: 3, backgroundColor: colors.segment },
  fill: { position: "absolute", height: 6, borderRadius: 3, backgroundColor: colors.brand },
  thumb: {
    position: "absolute",
    width: THUMB,
    height: THUMB,
    borderRadius: THUMB / 2,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.ink,
    boxShadow: `2px 2px 0 ${colors.ink}`,
  },
});
