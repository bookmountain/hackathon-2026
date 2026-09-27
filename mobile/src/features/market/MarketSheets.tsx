import { router } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Button, Icon, Photo } from "@/components/ui";
import type { Item, Pickup } from "@/data/types";
import { MapSheet } from "@/features/map";
import { colors, font } from "@/theme";
import { availabilityColors, availabilityShort } from "./logic";

const openItem = (id: string) => router.push({ pathname: "/market/[id]", params: { id } });

// Tapped a safe pickup point: what's waiting there. Busy spots hold dozens of items, so the
// list scrolls inside a capped sheet and there's always a close button.
export function PickupSheet({ pickup, items, onClose }: { pickup: Pickup; items: Item[]; onClose: () => void }) {
  return (
    <MapSheet>
      <View style={styles.pickupHead}>
        <View style={styles.pickupIcon}>
          <Icon name="star" size={20} color={colors.yellow} />
        </View>
        <View style={styles.flex}>
          <Text style={styles.pickupName} numberOfLines={1}>
            {pickup.name}
          </Text>
          <Text style={styles.pickupSub} numberOfLines={1}>
            Safe pickup point · {pickup.sub}
          </Text>
        </View>
        <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="Close" hitSlop={8} style={styles.close}>
          <Icon name="close" size={18} color={colors.ink} />
        </Pressable>
      </View>
      <Text style={styles.count}>
        {items.length === 1 ? "1 item" : `${items.length} items`} waiting here
      </Text>
      <ScrollView style={styles.list} contentContainerStyle={styles.rows}>
        {items.map((i) => {
          const badge = availabilityColors(i.avail);
          return (
            <Pressable
              key={i.id}
              onPress={() => openItem(i.id)}
              accessibilityRole="button"
              style={({ pressed }) => [styles.row, pressed && { backgroundColor: colors.brandSoft }]}
            >
              <Photo uri={i.photo} tone={i.tone} label={i.cat} style={styles.rowPhoto} />
              <View style={styles.rowText}>
                <Text style={styles.rowTitle} numberOfLines={1}>
                  {i.title}
                </Text>
                <Text style={styles.rowMeta} numberOfLines={1}>
                  {i.cond} · {i.cat} · {i.posted}
                </Text>
                <View style={[styles.badge, { backgroundColor: badge.bg }]}>
                  <Text style={[styles.badgeText, { color: badge.fg }]}>{availabilityShort(i.avail)}</Text>
                </View>
              </View>
              <Text style={styles.rowPrice}>${i.price}</Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </MapSheet>
  );
}

// Tapped a seller's own price tag
export function ItemSheet({ item }: { item: Item }) {
  const place = item.loc;
  return (
    <MapSheet>
      <View style={styles.itemHead}>
        <Photo uri={item.photo} tone={colors.brandSoft} label="photo" style={styles.thumb} />
        <View style={styles.itemText}>
          <Text style={styles.itemPrice}>${item.price}</Text>
          <Text style={styles.itemTitle}>{item.title}</Text>
          <Text style={[styles.itemAvail, { color: availabilityColors(item.avail).fg }]}>
            {item.avail} · pickup {place.name}
          </Text>
        </View>
      </View>
      <Button label="View listing" size="md" onPress={() => openItem(item.id)} />
    </MapSheet>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  pickupHead: { flexDirection: "row", alignItems: "center", gap: 12 },
  pickupIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.ink, alignItems: "center", justifyContent: "center" },
  pickupName: { color: colors.ink, ...font(800, 17) },
  pickupSub: { color: colors.muted, ...font(600, 12.5) },
  close: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.brandSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  count: { color: colors.muted, ...font(700, 12.5) },
  // About five rows, then it scrolls; the map stays visible above
  list: { maxHeight: 380 },
  rows: { gap: 8, paddingBottom: 4 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: colors.canvas,
    borderRadius: 14,
    padding: 8,
  },
  rowPhoto: { width: 60, height: 60, borderRadius: 12 },
  rowText: { flex: 1, minWidth: 0, gap: 3, alignItems: "flex-start" },
  rowTitle: { alignSelf: "stretch", color: colors.ink, ...font(700, 14) },
  rowMeta: { alignSelf: "stretch", color: colors.muted, ...font(600, 12) },
  badge: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 },
  badgeText: { ...font(800, 10.5) },
  rowPrice: { color: colors.ink, paddingRight: 6, ...font(800, 16) },
  itemHead: { flexDirection: "row", alignItems: "center", gap: 14 },
  thumb: { width: 76, height: 76, borderRadius: 16 },
  itemText: { flex: 1, minWidth: 0, gap: 3 },
  itemPrice: { color: colors.ink, ...font(800, 22) },
  itemTitle: { color: colors.ink, ...font(700, 14) },
  itemAvail: { ...font(600, 12) },
});
