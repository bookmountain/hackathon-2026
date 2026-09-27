import { useRef, useState } from "react";
import { StyleSheet, View, type LayoutChangeEvent } from "react-native";
import { colors } from "@/theme";

type Props = {
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (value: number) => void;
  /** Screen-reader label, e.g. "Max rent per week" */
  label: string;
  format: (value: number) => string;
};

const THUMB = 28;

// One-thumb slider for an upper limit; same look as RangeSlider
export default function MaxSlider({ min, max, step, value, onChange, label, format }: Props) {
  const [width, setWidth] = useState(0);
  // Where the current drag started: finger position and the thumb's value
  const drag = useRef({ pageX: 0, value: 0 });

  const clamp = (v: number) => Math.max(min, Math.min(max, v));
  const move = (pageX: number) => {
    if (!width) return;
    const raw = drag.current.value + ((pageX - drag.current.pageX) / width) * (max - min);
    const next = clamp(Math.round((raw - min) / step) * step + min);
    if (next !== value) onChange(next);
  };

  const x = max > min ? ((value - min) / (max - min)) * width : 0;
  const onLayout = (e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width - THUMB);

  return (
    <View style={styles.frame} onLayout={onLayout}>
      <View style={styles.track} />
      <View style={[styles.fill, { width: x }]} />
      <View
        onStartShouldSetResponder={() => true}
        onMoveShouldSetResponder={() => true}
        // Keep the drag when the sheet's ScrollView would like it
        onResponderTerminationRequest={() => false}
        onResponderGrant={(e) => {
          drag.current = { pageX: e.nativeEvent.pageX, value };
        }}
        onResponderMove={(e) => move(e.nativeEvent.pageX)}
        hitSlop={12}
        accessible
        accessibilityRole="adjustable"
        accessibilityLabel={label}
        accessibilityValue={{ text: format(value) }}
        accessibilityActions={[{ name: "increment" }, { name: "decrement" }]}
        onAccessibilityAction={(e) => onChange(clamp(value + (e.nativeEvent.actionName === "increment" ? step : -step)))}
        style={[styles.thumb, { left: x }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  frame: { height: THUMB + 8, justifyContent: "center" },
  track: { position: "absolute", left: THUMB / 2, right: THUMB / 2, height: 6, borderRadius: 3, backgroundColor: colors.segment },
  fill: { position: "absolute", left: THUMB / 2, height: 6, borderRadius: 3, backgroundColor: colors.brand },
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
