import { StyleSheet, Text, View } from "react-native";
import { Icon } from "@/components/ui";
import type { Item } from "@/data/types";
import { colors, font, shadows } from "@/theme";

// Safe pickup point: dark disc with a star and a yellow count badge
export function PickupPin({ count, selected }: { count: number; selected: boolean }) {
  return (
    <View style={styles.pickupBox}>
      <View style={[styles.pickup, { borderColor: selected ? colors.yellow : colors.surface }]}>
        <Icon name="star" size={14} color={colors.yellow} />
      </View>
      <View style={styles.count}>
        <Text style={styles.countText}>{count}</Text>
      </View>
    </View>
  );
}

// Seller's own pin: white "$25" tag with a blue (yellow when selected) outline
export function ItemTag({ item, selected }: { item: Item; selected: boolean }) {
  return (
    <View style={[styles.tag, { borderColor: selected ? colors.yellow : colors.brand }]}>
      <Icon name="tag" size={11} color={colors.brand} />
      <Text style={styles.tagText}>${item.price}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  // Extra room on the top-right so the count badge fits inside the marker view
  pickupBox: { paddingTop: 7, paddingRight: 9 },
  pickup: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.ink,
    borderWidth: 2.5,
    alignItems: "center",
    justifyContent: "center",
    ...shadows.pin,
  },
  count: {
    position: "absolute",
    top: 0,
    right: 0,
    minWidth: 17,
    height: 17,
    borderRadius: 9,
    paddingHorizontal: 4,
    backgroundColor: colors.yellow,
    alignItems: "center",
    justifyContent: "center",
  },
  countText: { color: colors.ink, ...font(800, 10) },
  tag: {
    height: 26,
    paddingHorizontal: 9,
    borderRadius: 13,
    borderWidth: 2,
    backgroundColor: colors.surface,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    shadowColor: colors.ink,
    shadowOpacity: 0.18,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  tagText: { color: colors.brand, ...font(800, 12) },
});
