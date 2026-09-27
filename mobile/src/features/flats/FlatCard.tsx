import { StyleSheet, Text, View } from "react-native";
import { GamePressable, Photo, Pill } from "@/components/ui";
import type { Flat } from "@/data/types";
import { colors, font } from "@/theme";

// Room card in the list view
export default function FlatCard({ flat, onPress }: { flat: Flat; onPress: () => void }) {
  return (
    <GamePressable kind="card" onPress={onPress} accessibilityRole="button" faceStyle={styles.card}>
      <Photo uri={flat.photo} tone={colors.brandSoft} label="room photo" style={styles.photo}>
        <View style={styles.price}>
          <Text style={styles.priceText}>
            ${flat.price}
            <Text style={styles.per}> /wk</Text>
          </Text>
        </View>
        <View style={styles.from}>
          <Text style={styles.fromText}>{flat.from}</Text>
        </View>
      </Photo>
      <View style={styles.body}>
        <Text style={styles.title}>{flat.title}</Text>
        <Text style={styles.meta}>
          {flat.beds} bed · {flat.toilet} · {flat.members} flatmates · +${flat.bills} bills
        </Text>
        <View style={styles.walks}>
          <Pill label={`${flat.walkA} min to Adelaide Uni`} />
          <Pill label={`${flat.walkF} min to Flinders City`} />
        </View>
      </View>
    </GamePressable>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderRadius: 22, overflow: "hidden" },
  photo: { aspectRatio: 16 / 9 },
  price: {
    position: "absolute",
    left: 12,
    bottom: 12,
    backgroundColor: colors.ink,
    borderRadius: 12,
    paddingHorizontal: 11,
    paddingVertical: 6,
  },
  priceText: { color: colors.surface, ...font(800, 15) },
  per: { color: colors.brandLight, ...font(600, 11) },
  from: {
    position: "absolute",
    right: 12,
    top: 12,
    backgroundColor: colors.surface,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  fromText: { color: colors.brandDeep, ...font(700, 11.5) },
  body: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 16, gap: 8 },
  title: { color: colors.ink, ...font(800, 16) },
  meta: { color: colors.muted, ...font(600, 13) },
  walks: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
});
