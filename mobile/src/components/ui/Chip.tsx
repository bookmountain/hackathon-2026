import { ScrollView, StyleSheet, Text, View } from "react-native";
import { colors, font } from "@/theme";
import GamePressable from "./GamePressable";

type ChipProps = {
  label: string;
  active: boolean;
  onPress: () => void;
  /** Floating chips sit on top of the map */
  floating?: boolean;
  /** An applied filter you tap to clear ("2+ bed  ✕"): blue text on white */
  removable?: boolean;
  height?: number;
};

// Filter / multi-select pill: blue when active, white with a border otherwise
export function Chip({ label, active, onPress, floating, removable, height = 36 }: ChipProps) {
  return (
    <GamePressable
      kind="sm"
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      faceStyle={[styles.chip, { height }, active ? styles.active : styles.inactive]}
    >
      <Text style={[floating ? styles.floatingLabel : styles.label, { color: active ? colors.surface : removable ? colors.brand : floating ? colors.body : colors.ink }]}>{label}</Text>
    </GamePressable>
  );
}

type Option = { label: string; active: boolean; removable?: boolean; onPress: () => void };

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
    alignItems: "center",
    justifyContent: "center",
  },
  active: { backgroundColor: colors.brand },
  inactive: { backgroundColor: colors.surface },
  label: { ...font(700, 13) },
  floatingLabel: { ...font(600, 13) },
  // Room below for the chips' ledge, which the scroll view would clip
  row: { gap: 8, paddingBottom: 3 },
  floatingRow: { paddingTop: 2, paddingBottom: 8 },
  wrap: { flexDirection: "row", flexWrap: "wrap", gap: 8, rowGap: 11 },
});
