import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Button, Icon, Photo } from "@/components/ui";
import type { Item, Pickup } from "@/data/types";
import { MapSheet } from "@/features/map";
import { colors, font } from "@/theme";
import { availabilityColors } from "./logic";

const openItem = (id: string) => router.push({ pathname: "/market/[id]", params: { id } });

// Tapped a safe pickup point: what's waiting there
export function PickupSheet({ pickup, items }: { pickup: Pickup; items: Item[] }) {
  return (
    <MapSheet>
      <View style={styles.pickupHead}>
        <View style={styles.pickupIcon}>
          <Icon name="star" size={20} color={colors.yellow} />
        </View>
        <View style={styles.flex}>
          <Text style={styles.pickupName}>{pickup.name}</Text>
          <Text style={styles.pickupSub}>Safe pickup point · {pickup.sub}</Text>
        </View>
      </View>
      <View style={styles.rows}>
        {items.map((i) => (
          <Pressable key={i.id} onPress={() => openItem(i.id)} style={styles.row}>
            <Text style={styles.rowTitle} numberOfLines={1}>
              {i.title}
            </Text>
            <Text style={styles.rowPrice}>${i.price}</Text>
          </Pressable>
        ))}
      </View>
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
  rows: { gap: 6 },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    backgroundColor: colors.canvas,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  rowTitle: { flex: 1, color: colors.ink, ...font(700, 14) },
  rowPrice: { color: colors.brand, ...font(700, 14) },
  itemHead: { flexDirection: "row", alignItems: "center", gap: 14 },
  thumb: { width: 76, height: 76, borderRadius: 16 },
  itemText: { flex: 1, minWidth: 0, gap: 3 },
  itemPrice: { color: colors.ink, ...font(800, 22) },
  itemTitle: { color: colors.ink, ...font(700, 14) },
  itemAvail: { ...font(600, 12) },
});
