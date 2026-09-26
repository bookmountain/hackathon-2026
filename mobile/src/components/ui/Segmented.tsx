import type { ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, font } from "@/theme";

export type SegmentOption<T extends string> = { value: T; label: string; icon?: (color: string) => ReactNode };

type Props<T extends string> = {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  /** "form" = 40px tall segments inside forms, "compact" = the Map/List toggle */
  size?: "form" | "compact";
};

// Grey track; the selected option is a yellow segment with a hard ink shadow
export default function Segmented<T extends string>({ options, value, onChange, size = "form" }: Props<T>) {
  const compact = size === "compact";
  return (
    <View style={[styles.track, compact ? styles.trackCompact : styles.trackForm]}>
      {options.map((o) => {
        const active = o.value === value;
        const fg = active ? colors.ink : colors.muted;
        return (
          <Pressable
            key={o.value}
            onPress={() => onChange(o.value)}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            style={[
              styles.segment,
              compact ? styles.segmentCompact : styles.segmentForm,
              active && styles.active,
            ]}
          >
            {o.icon?.(fg)}
            <Text style={[compact ? font(700, 13) : font(700, 12.5), { color: fg }]}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: { flexDirection: "row", backgroundColor: colors.segment },
  trackForm: { borderRadius: 14, padding: 4, gap: 4 },
  trackCompact: { borderRadius: 12, padding: 3, gap: 3 },
  segment: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5 },
  segmentForm: { height: 40, borderRadius: 11 },
  segmentCompact: { height: 32, borderRadius: 9 },
  active: {
    backgroundColor: colors.yellow,
    boxShadow: `2px 2px 0 ${colors.ink}`,
  },
});
