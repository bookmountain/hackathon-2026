import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { GamePressable, Icon } from "@/components/ui";
import { brutal, colors, font } from "@/theme";

type Props = {
  query: string;
  onQueryChange: (q: string) => void;
  placeholder: string;
  /** How many filters are on; shown as a badge */
  filterCount: number;
  onFilters: () => void;
};

// List view: search box and the Filters button
export default function ListSearchBar({ query, onQueryChange, placeholder, filterCount, onFilters }: Props) {
  return (
    <View style={styles.row}>
      <View style={styles.search}>
        <Icon name="search" size={18} color={colors.faint} />
        <TextInput
          value={query}
          onChangeText={onQueryChange}
          placeholder={placeholder}
          placeholderTextColor={colors.faint}
          returnKeyType="search"
          autoCorrect={false}
          style={styles.input}
        />
        {query ? (
          <Pressable onPress={() => onQueryChange("")} hitSlop={8} accessibilityRole="button" accessibilityLabel="Clear search">
            <Icon name="close" size={16} color={colors.muted} />
          </Pressable>
        ) : null}
      </View>
      <GamePressable
        kind="sm"
        onPress={onFilters}
        accessibilityRole="button"
        accessibilityLabel={filterCount ? `Filters, ${filterCount} on` : "Filters"}
        faceStyle={(pressed) => [styles.filters, (pressed || filterCount > 0) && { backgroundColor: colors.brandSoft }]}
      >
        <Icon name="filter" size={18} color={colors.ink} />
        <Text style={styles.filtersText}>Filters</Text>
        {filterCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{filterCount}</Text>
          </View>
        )}
      </GamePressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: 10 },
  search: {
    flex: 1,
    height: 46,
    borderRadius: 14,
    ...brutal(0),
    backgroundColor: colors.surface,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
  },
  input: { flex: 1, height: "100%", color: colors.ink, ...font(500, 14.5) },
  filters: {
    height: 46,
    borderRadius: 14,
    backgroundColor: colors.surface,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
  },
  filtersText: { color: colors.ink, ...font(700, 14) },
  badge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    paddingHorizontal: 5,
    backgroundColor: colors.yellow,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: { color: colors.ink, ...font(800, 11.5) },
});
