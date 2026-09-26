import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { colors, font, shadows } from "@/theme";

type ChipProps = {
  label: string;
  active: boolean;
  onPress: () => void;
  /** Floating chips sit on top of the map and get a shadow */
  floating?: boolean;
  height?: number;
};

// Filter / multi-select pill: blue when active, white with a border otherwise
export function Chip({ label, active, onPress, floating, height = 36 }: ChipProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      style={[
        styles.chip,
        { height },
        active ? styles.active : styles.inactive,
        floating && shadows.floating,
      ]}
    >
      <Text style={[styles.label, { color: active ? colors.surface : colors.ink }]}>{label}</Text>
    </Pressable>
  );
}

type Option = { label: string; active: boolean; onPress: () => void };

// Horizontally scrolling row of chips (filters, categories)
export function ChipRow({
  options,
  floating,
  height,
  inset = 18,
}: {
  options: Option[];
  floating?: boolean;
  height?: number;
  inset?: number;
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={[styles.row, { paddingHorizontal: inset }, floating && styles.floatingRow]}
    >
      {options.map((o) => (
        <Chip key={o.label} {...o} floating={floating} height={height} />
      ))}
    </ScrollView>
  );
}

// Wrapping group of chips (form multi-selects)
export function ChipWrap({ options }: { options: Option[] }) {
  return (
    <View style={styles.wrap}>
      {options.map((o) => (
        <Chip key={o.label} {...o} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  active: { backgroundColor: colors.brand, borderColor: colors.brand },
  inactive: { backgroundColor: colors.surface, borderColor: colors.line },
  label: { ...font(700, 13) },
  row: { gap: 8 },
  floatingRow: { paddingVertical: 8 },
  wrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
});
