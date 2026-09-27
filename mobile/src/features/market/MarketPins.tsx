import { StyleSheet, Text, View } from "react-native";
import Svg, { Path } from "react-native-svg";
import type { Item } from "@/data/types";
import { colors, font } from "@/theme";

// Safe pickup point: ink disc with a shopping bag and a coral count badge
export function PickupPin({ count, selected }: { count: number; selected: boolean }) {
  return (
    <View style={styles.pickupBox}>
      <View style={[styles.pickup, { borderColor: selected ? colors.pinCoral : colors.surface }]}>
        <Svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke={colors.surface} strokeWidth={2.2} strokeLinejoin="round">
          <Path d="M6 8h12l-1 12H7z" />
          <Path d="M9 8a3 3 0 0 1 6 0" />
        </Svg>
      </View>
      <View style={styles.count}>
        <Text style={styles.countText}>{count}</Text>
      </View>
    </View>
  );
}

// Seller's own pin: white "$25" pill, ink when selected
export function ItemTag({ item, selected }: { item: Item; selected: boolean }) {
  return (
    <View style={[styles.tag, { backgroundColor: selected ? colors.pinInk : colors.surface }]}>
      <Text style={[styles.tagText, { color: selected ? colors.surface : colors.pinInk }]}>${item.price}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  // Room for the count badge (8 up, 10 right) on every side, so the disc stays centred on its point
  pickupBox: { paddingVertical: 8, paddingHorizontal: 10 },
  pickup: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.pinInk,
    borderWidth: 2.5,
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 3px 8px rgba(10,26,63,0.35)",
  },
  count: {
    position: "absolute",
    top: 0,
    right: 0,
    minWidth: 17,
    height: 17,
    borderRadius: 9,
    paddingHorizontal: 4,
    backgroundColor: colors.pinCoral,
    alignItems: "center",
    justifyContent: "center",
  },
  countText: { color: colors.pinInk, ...font(800, 10) },
  tag: {
    height: 26,
    paddingHorizontal: 9,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 4px 12px rgba(15,18,38,0.3)",
  },
  tagText: { ...font(800, 12) },
});
