import { StyleSheet, Text, View } from "react-native";
import { GamePressable, Icon, Photo } from "@/components/ui";
import type { Item } from "@/data/types";
import { colors, font } from "@/theme";
import { availabilityColors, availabilityShort, isSold } from "./logic";

// Square card in the Market grid; sold items are faded
export default function ItemCard({ item, onPress }: { item: Item; onPress: () => void }) {
  const badge = availabilityColors(item.avail);
  return (
    <GamePressable
      kind="card"
      onPress={onPress}
      accessibilityRole="button"
      style={[styles.cell, isSold(item) && styles.sold]}
      faceStyle={styles.card}
    >
      <Photo uri={item.photo} tone={colors.brandSoft} label={item.cat} style={styles.photo}>
        {item.avail !== "Available now" && (
          <View style={[styles.badge, { backgroundColor: badge.bg }]}>
            <Text style={[styles.badgeText, { color: badge.fg }]}>{availabilityShort(item.avail)}</Text>
          </View>
        )}
      </Photo>
      <View style={styles.body}>
        <Text style={styles.price}>${item.price}</Text>
        <Text style={styles.title} numberOfLines={1}>
          {item.title}
        </Text>
        <View style={styles.place}>
          <Icon name="pin" size={11} color={colors.muted} />
          <Text style={styles.placeText} numberOfLines={1}>
            {item.loc.short}
          </Text>
        </View>
      </View>
    </GamePressable>
  );
}

const styles = StyleSheet.create({
  cell: { flex: 1, minWidth: 0 },
  card: { backgroundColor: colors.surface, borderRadius: 18, overflow: "hidden" },
  sold: { opacity: 0.55 },
  photo: { aspectRatio: 1 },
  badge: { position: "absolute", left: 8, top: 8, borderRadius: 999, paddingHorizontal: 9, paddingVertical: 4 },
  badgeText: { ...font(800, 10.5) },
  body: { paddingHorizontal: 12, paddingTop: 10, paddingBottom: 12, gap: 3 },
  price: { color: colors.ink, ...font(800, 16) },
  title: { color: colors.ink, ...font(600, 13, 1.3) },
  place: { flexDirection: "row", alignItems: "center", gap: 3 },
  placeText: { flex: 1, color: colors.muted, ...font(600, 11.5) },
});
