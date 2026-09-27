import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button, Segmented } from "@/components/ui";
import { FilterSection } from "@/features/filters/FilterSheet";
import { colors, font } from "@/theme";
import MaxSlider from "./MaxSlider";
import {
  BILLS_SLIDER,
  EMPTY_FLAT_FILTERS,
  FURNISHED_OPTIONS,
  RENT_SLIDER,
  sliderLimit,
  type FlatFilters,
  type ToiletFilter,
} from "./logic";

type Props = {
  filters: FlatFilters;
  onChange: (filters: FlatFilters) => void;
  /** Rooms matching the search and filters, for "Show N rooms" */
  count: number;
  onClose: () => void;
};

const BED_OPTIONS = [0, 1, 2, 3, 4].map((n) => ({ value: String(n), label: n ? `${n}+` : "Any" }));
const MATE_OPTIONS = ["Any", "1", "2", "3", "4"].map((v) => ({ value: v, label: v }));
const TOILET_OPTIONS = (["Any", "Ensuite", "Shared"] as const).map((v) => ({ value: v, label: v }));

// "Filter rooms": changes apply straight away (map and list update behind it); the button just closes
export default function FlatFiltersSheet({ filters, onChange, count, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const set = (change: Partial<FlatFilters>) => onChange({ ...filters, ...change });
  const money = (v: number | null) => (v === null ? "Any" : `$${v}`);

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Close filters" />
      <View style={[styles.sheet, { paddingBottom: insets.bottom + 12 }]}>
        <View style={styles.header}>
          <Text style={styles.title}>Filter rooms</Text>
          <Pressable onPress={() => onChange(EMPTY_FLAT_FILTERS)} hitSlop={8} accessibilityRole="button">
            <Text style={styles.reset}>Reset</Text>
          </Pressable>
        </View>
        <ScrollView contentContainerStyle={styles.body}>
          <FilterSection title="Max rent per week" value={money(filters.maxRent)}>
            <MaxSlider
              {...RENT_SLIDER}
              value={filters.maxRent ?? RENT_SLIDER.max}
              onChange={(v) => set({ maxRent: sliderLimit(v, RENT_SLIDER) })}
              label="Max rent per week"
              format={(v) => (v >= RENT_SLIDER.max ? "Any" : `$${v} a week`)}
            />
            <Ends low={`$${RENT_SLIDER.min}`} />
          </FilterSection>

          <FilterSection title="Max bills per week" value={money(filters.maxBills)}>
            <MaxSlider
              {...BILLS_SLIDER}
              value={filters.maxBills ?? BILLS_SLIDER.max}
              onChange={(v) => set({ maxBills: sliderLimit(v, BILLS_SLIDER) })}
              label="Max bills per week"
              format={(v) => (v >= BILLS_SLIDER.max ? "Any" : `$${v} a week`)}
            />
            <Ends low={`$${BILLS_SLIDER.min}`} />
          </FilterSection>

          <FilterSection title="Bedrooms">
            <Segmented options={BED_OPTIONS} value={String(filters.minBeds)} onChange={(v) => set({ minBeds: Number(v) })} />
          </FilterSection>

          <FilterSection title="Furnished">
            <Segmented options={[...FURNISHED_OPTIONS]} value={filters.furnished} onChange={(furnished) => set({ furnished })} />
          </FilterSection>

          <FilterSection title="Toilet">
            <Segmented<ToiletFilter> options={TOILET_OPTIONS} value={filters.toilet} onChange={(toilet) => set({ toilet })} />
          </FilterSection>

          <FilterSection title="Max flatmates">
            <Segmented
              options={MATE_OPTIONS}
              value={filters.maxMates === null ? "Any" : String(filters.maxMates)}
              onChange={(v) => set({ maxMates: v === "Any" ? null : Number(v) })}
            />
          </FilterSection>
        </ScrollView>
        <View style={styles.footer}>
          <Button label={count === 1 ? "Show 1 room" : `Show ${count} rooms`} size="md" onPress={onClose} />
        </View>
      </View>
    </Modal>
  );
}

/** Captions under a slider: its lowest value and "Any" at the top */
function Ends({ low }: { low: string }) {
  return (
    <View style={styles.ends}>
      <Text style={styles.end}>{low}</Text>
      <Text style={styles.end}>Any</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(20,20,43,0.5)" },
  sheet: {
    maxHeight: "88%",
    backgroundColor: colors.surface,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 10,
  },
  title: { color: colors.ink, ...font(800, 20) },
  reset: { color: colors.brand, ...font(700, 13.5) },
  body: { paddingHorizontal: 20, paddingTop: 6, paddingBottom: 16, gap: 20 },
  ends: { flexDirection: "row", justifyContent: "space-between", marginTop: -6 },
  end: { color: colors.faint, ...font(600, 11) },
  // Light 1px rule above the button, not the ink divider
  footer: { borderTopWidth: 1, borderTopColor: "#ECEEF6", paddingHorizontal: 20, paddingTop: 12 },
});
