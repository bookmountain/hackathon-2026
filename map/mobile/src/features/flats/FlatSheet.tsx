import { router } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { useToast } from "@/components/feedback/Toast";
import { Button, Pill } from "@/components/ui";
import type { Flat } from "@/data/types";
import { MapSheet } from "@/features/map";
import { useAppStore } from "@/store";
import { colors, font } from "@/theme";
import { messageTenant } from "./messageTenant";

// Card shown over the map after tapping a price pin
export default function FlatSheet({ flat }: { flat: Flat }) {
  const { actions } = useAppStore();
  const toast = useToast();
  const facts = [
    { k: "Bedrooms", v: String(flat.beds) },
    { k: "Flatmates", v: String(flat.members) },
    { k: "Bills/wk", v: `$${flat.bills}` },
    { k: "Min stay", v: flat.minStay.replace(" months", "mo").replace(" month", "mo") },
  ];

  return (
    <MapSheet>
      <View style={styles.head}>
        <View style={styles.headText}>
          <Text style={styles.price}>
            ${flat.price}
            <Text style={styles.per}> /week</Text>
          </Text>
          <Text style={styles.title}>{flat.title}</Text>
          <Text style={styles.area}>
            {flat.area} · {flat.from}
          </Text>
        </View>
        <Pill label={`+$${flat.bills} bills`} />
      </View>

      <View style={styles.facts}>
        {facts.map((f) => (
          <View key={f.k} style={styles.fact}>
            <Text style={styles.factValue}>{f.v}</Text>
            <Text style={styles.factLabel}>{f.k}</Text>
          </View>
        ))}
      </View>

      <Text style={styles.summary}>
        {flat.toilet} · {flat.furnished} · {flat.feats.slice(0, 3).join(", ")}
      </Text>

      <View style={styles.actions}>
        <Button
          label="View room"
          size="md"
          style={styles.grow}
          onPress={() => router.push({ pathname: "/flats/[id]", params: { id: flat.id } })}
        />
        <Button
          label="Message tenant"
          size="md"
          variant="outline"
          weight={700}
          style={styles.grow}
          onPress={() => messageTenant(flat, actions, toast)}
        />
      </View>
    </MapSheet>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 10 },
  headText: { flex: 1, gap: 3 },
  price: { color: colors.ink, ...font(800, 24, undefined, -0.02) },
  per: { color: colors.muted, ...font(600, 14) },
  title: { color: colors.ink, ...font(700, 14) },
  area: { color: colors.muted, ...font(500, 12.5) },
  facts: { flexDirection: "row", gap: 6 },
  fact: { flex: 1, backgroundColor: colors.canvas, borderRadius: 12, paddingVertical: 8, paddingHorizontal: 6, alignItems: "center", gap: 2 },
  factValue: { color: colors.ink, ...font(800, 14) },
  factLabel: { color: colors.muted, ...font(600, 10.5) },
  summary: { color: colors.body, ...font(500, 13, 1.45) },
  actions: { flexDirection: "row", gap: 8 },
  grow: { flex: 1 },
});
