import { router, useLocalSearchParams } from "expo-router";
import { useState, type ReactNode } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useToast } from "@/components/feedback/Toast";
import { BackButton, Button, Pill, Striped, TextField } from "@/components/ui";
import { findPerson, selectMe, useAppStore } from "@/store";
import { colors, font } from "@/theme";
import { messageTenant } from "./messageTenant";

const QUICK_QUESTIONS = ["Is it still available?", "Can I inspect this week?", "How are bills split?"];
/** A 20-minute walk fills the bar */
const WALK_BAR_MAX = 20;

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

export default function FlatDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { state, actions } = useAppStore();
  const toast = useToast();
  const [message, setMessage] = useState("");
  const flat = state.flats.find((f) => f.id === id);
  if (!flat) return null;

  const me = selectMe(state);
  const tenant =
    flat.tenant === "me"
      ? { nick: `${me.nick} (you)`, line: `${me.major || "Your major"} · ${me.uni}` }
      : (() => {
          const p = findPerson(flat.tenant);
          return { nick: p?.nick ?? "Tenant", line: p ? `${p.major} · ${p.uni}` : "" };
        })();

  const roomFacts = [
    { k: "Bedrooms", v: `${flat.beds} bedrooms` },
    { k: "Toilet", v: flat.toilet },
    { k: "Bathroom", v: flat.bath },
    { k: "Flatmates", v: `${flat.members} living here` },
  ];
  const details = [
    { k: "Bills weekly", v: `$${flat.bills} (power, gas, Wi-Fi)` },
    { k: "Minimum stay", v: flat.minStay },
    { k: "Furnished", v: flat.furnished },
    { k: "Preferred flatmate", v: flat.pref },
  ];
  const walks = [
    { k: "Adelaide Uni", v: flat.walkA },
    { k: "Flinders City", v: flat.walkF },
  ];

  return (
    <View style={styles.screen}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView keyboardShouldPersistTaps="handled">
          <Striped tone={flat.tone} stripe={14} label="room photos · 1/5" style={styles.photo}>
            <SafeAreaView edges={["top"]} style={styles.back}>
              <BackButton variant="white" onPress={() => router.back()} />
            </SafeAreaView>
          </Striped>

          <View style={styles.body}>
            <View style={styles.headline}>
              <View style={styles.priceRow}>
                <Text style={styles.price}>
                  ${flat.price}
                  <Text style={styles.per}> /week</Text>
                </Text>
                <Pill label={flat.from} size={12} />
              </View>
              <Text style={styles.title}>{flat.title}</Text>
              <Text style={styles.area}>{flat.area}</Text>
            </View>

            <View style={styles.cost}>
              <View style={styles.costMain}>
                <Text style={styles.costLabel}>Real weekly cost</Text>
                <Text style={styles.costTotal}>${flat.price + flat.bills}/wk</Text>
              </View>
              <Text style={styles.costSplit}>
                ${flat.price} rent{"\n"}+ ${flat.bills} bills
              </Text>
            </View>

            <Section title="The room">
              <View style={styles.grid}>
                {roomFacts.map((f) => (
                  <View key={f.k} style={styles.gridCell}>
                    <Text style={styles.factKey}>{f.k}</Text>
                    <Text style={styles.factValue}>{f.v}</Text>
                  </View>
                ))}
              </View>
            </Section>

            <Section title="Details">
              <View style={styles.table}>
                {details.map((d, i) => (
                  <View key={d.k} style={[styles.row, i < details.length - 1 && styles.rowDivider]}>
                    <Text style={styles.rowKey}>{d.k}</Text>
                    <Text style={styles.rowValue}>{d.v}</Text>
                  </View>
                ))}
              </View>
            </Section>

            <Section title="Features">
              <View style={styles.wrap}>
                {flat.feats.map((f) => (
                  <Pill key={f} label={f} size={13} />
                ))}
              </View>
            </Section>

            <Section title="Who lives here">
              <View style={styles.wrap}>
                {flat.tenants.map((t) => (
                  <View key={t} style={styles.tenant}>
                    <View style={styles.anon}>
                      <Text style={styles.anonText}>?</Text>
                    </View>
                    <Text style={styles.tenantText}>{t}</Text>
                  </View>
                ))}
              </View>
              <View style={styles.wrap}>
                {flat.rhythm.map((r) => (
                  <Pill key={r} label={r} dashed size={12.5} />
                ))}
              </View>
            </Section>

            <Section title="Walk to campus">
              {walks.map((w) => (
                <View key={w.k} style={styles.walk}>
                  <Text style={styles.walkLabel}>{w.k}</Text>
                  <View style={styles.bar}>
                    <View style={[styles.barFill, { width: `${Math.min(100, (w.v / WALK_BAR_MAX) * 100)}%` }]} />
                  </View>
                  <Text style={styles.walkValue}>{w.v} min</Text>
                </View>
              ))}
            </Section>

            <View style={styles.messageBox}>
              <Text style={styles.sectionTitle}>Message {tenant.nick}</Text>
              <Text style={styles.area}>Current tenant · {tenant.line}</Text>
              <View style={styles.wrap}>
                {QUICK_QUESTIONS.map((q) => (
                  <Pressable key={q} onPress={() => setMessage(message ? `${message} ${q}` : q)} style={styles.quick}>
                    <Text style={styles.quickText}>{q}</Text>
                  </Pressable>
                ))}
              </View>
              <TextField multiline value={message} onChangeText={setMessage} />
            </View>
          </View>
        </ScrollView>

        <SafeAreaView edges={["bottom"]} style={styles.footer}>
          <Button
            label="Send message to tenant"
            onPress={() => messageTenant(flat, actions, toast, message.trim() || undefined)}
          />
        </SafeAreaView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surface },
  flex: { flex: 1 },
  photo: { height: 230 },
  back: { position: "absolute", left: 14, top: 14 },
  body: { paddingHorizontal: 20, paddingTop: 18, paddingBottom: 20, gap: 20 },
  headline: { gap: 6 },
  priceRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  price: { color: colors.ink, ...font(800, 30, undefined, -0.02) },
  per: { color: colors.muted, ...font(600, 15) },
  title: { color: colors.ink, ...font(800, 18, 1.25) },
  area: { color: colors.muted, ...font(500, 13.5) },
  cost: {
    backgroundColor: colors.ink,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  costMain: { gap: 2 },
  costLabel: { color: colors.brandLight, ...font(600, 12) },
  costTotal: { color: colors.surface, ...font(800, 22) },
  costSplit: { color: colors.brandLight, textAlign: "right", ...font(600, 12.5, 1.4) },
  section: { gap: 10 },
  sectionTitle: { color: colors.ink, ...font(800, 16) },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  gridCell: { width: "48.5%", backgroundColor: colors.canvas, borderRadius: 14, padding: 12, gap: 3 },
  factKey: { color: colors.muted, ...font(600, 11.5) },
  factValue: { color: colors.ink, ...font(800, 14) },
  table: { borderWidth: 1.5, borderColor: colors.lineSoft, borderRadius: 16 },
  row: { flexDirection: "row", justifyContent: "space-between", gap: 16, paddingHorizontal: 14, paddingVertical: 12 },
  rowDivider: { borderBottomWidth: 1, borderBottomColor: colors.lineSoft },
  rowKey: { color: colors.muted, ...font(600, 13.5) },
  rowValue: { flex: 1, textAlign: "right", color: colors.ink, ...font(600, 13.5) },
  wrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  tenant: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.canvas,
    borderRadius: 14,
    paddingVertical: 8,
    paddingLeft: 8,
    paddingRight: 12,
  },
  anon: { width: 26, height: 26, borderRadius: 13, backgroundColor: colors.anon, alignItems: "center", justifyContent: "center" },
  anonText: { color: colors.faint, ...font(800, 11) },
  tenantText: { color: colors.ink, ...font(700, 13) },
  walk: { flexDirection: "row", alignItems: "center", gap: 10 },
  walkLabel: { width: 110, color: colors.ink, ...font(600, 13) },
  bar: { flex: 1, height: 8, borderRadius: 4, backgroundColor: colors.brandSoft, overflow: "hidden" },
  barFill: { height: "100%", borderRadius: 4, backgroundColor: colors.brand },
  walkValue: { width: 48, textAlign: "right", color: colors.ink, ...font(800, 13) },
  messageBox: { backgroundColor: colors.canvas, borderRadius: 20, padding: 16, gap: 10 },
  quick: {
    borderWidth: 1.5,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    borderRadius: 999,
    paddingHorizontal: 11,
    paddingVertical: 6,
  },
  quickText: { color: colors.ink, ...font(600, 12) },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 12,
    borderTopWidth: 1,
    borderTopColor: colors.lineSoft,
    backgroundColor: colors.surface,
  },
});
