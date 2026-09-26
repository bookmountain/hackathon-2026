import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { brutal, colors, font } from "@/theme";

type ChipProps = {
  label: string;
  active: boolean;
  onPress: () => void;
  /** Floating chips sit on top of the map and get a hard shadow */
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
        floating && styles.floating,
      ]}
    >
      <Text style={[floating ? styles.floatingLabel : styles.label, { color: active ? colors.surface : floating ? colors.body : colors.ink }]}>{label}</Text>
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
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  active: { backgroundColor: colors.brand, borderColor: colors.brand },
  inactive: { backgroundColor: colors.surface, borderColor: colors.ink },
  floating: { ...brutal(2), paddingHorizontal: 14 },
  label: { ...font(700, 13) },
  floatingLabel: { ...font(600, 13) },
  row: { gap: 8 },
  floatingRow: { paddingTop: 2, paddingBottom: 8 },
  wrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
});
