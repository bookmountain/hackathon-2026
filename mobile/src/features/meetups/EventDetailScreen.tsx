import { router, useLocalSearchParams } from "expo-router";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as api from "@/api/endpoints";
import { useLoad } from "@/api/hooks";
import { Button, ScreenHeader } from "@/components/ui";
import { toEventDetail } from "@/data/adapters";
import type { EventDetail as EventDetailData } from "@/data/types";
import { MapDot, MiniMap, regionAround } from "@/features/map";
import { LoadingScreen } from "@/features/shell/LoadingScreen";
import { useAppStore } from "@/store";
import { colors, font } from "@/theme";
import { fillPercent } from "./logic";
import { useJoin } from "./useJoin";

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { state } = useAppStore();
  const { data, error, reload } = useLoad(() => api.events.get(id), id);
  if (!data) return <LoadingScreen error={error} onRetry={reload} />;
  const detail = toEventDetail(data);
  // The list copy has the live headcount and your Join state
  const live = state.events.find((e) => e.id === id);
  return <EventDetail event={live ? { ...detail, ...live } : detail} />;
}

function EventDetail({ event }: { event: EventDetailData }) {
  const { joined, going, busy, toggle } = useJoin(event);
  return (
    <SafeAreaView edges={["top", "bottom"]} style={styles.screen}>
      <ScreenHeader onBack={() => router.back()} bordered={false} />
      <ScrollView contentContainerStyle={styles.body}>
        <View style={styles.headline}>
          <Text style={styles.kicker}>
            {event.cat} · {event.walkIns ? "Walk-in welcome" : "Join to go"}
          </Text>
          <Text style={styles.title}>{event.title}</Text>
        </View>

        <View style={styles.table}>
          <View style={[styles.row, styles.rowDivider]}>
            <Text style={styles.rowKey}>When</Text>
            <Text style={styles.rowValue}>{event.when}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.rowKey}>Where</Text>
            <Text style={styles.rowValue}>{event.where.name}</Text>
          </View>
        </View>

        <MiniMap region={regionAround(event.where)}>
          <MapDot
            latitude={event.where.latitude}
            longitude={event.where.longitude}
            color={colors.yellow}
            haloOpacity={0.35}
            size={12}
            stroke={colors.ink}
            strokeWidth={2}
          />
        </MiniMap>

        {event.desc ? <Text style={styles.desc}>{event.desc}</Text> : null}

        <View style={styles.host}>
          <View style={styles.hostRow}>
            <View style={styles.anon}>
              <Text style={styles.anonText}>?</Text>
            </View>
            <View>
              <Text style={styles.hostTitle}>{event.host ? "You're hosting · anonymously" : "Hosted anonymously"}</Text>
              <Text style={styles.hostSub}>Verified student host</Text>
            </View>
          </View>
          <View style={styles.capacity}>
            <View style={styles.capacityRow}>
              <Text style={styles.capacityText}>{going} going · names hidden</Text>
              <Text style={[styles.capacityText, { color: colors.muted }]}>{event.cap} spots</Text>
            </View>
            <View style={styles.bar}>
              <View style={[styles.barFill, { width: `${Math.min(100, fillPercent(event))}%` }]} />
            </View>
          </View>
        </View>
      </ScrollView>
      <View style={styles.footer}>
        <Button
          label={
            event.host
              ? "You're hosting"
              : joined
                ? "You're going — just walk in"
                : event.full
                  ? "Full"
                  : "Join — walk in anytime"
          }
          variant={joined ? "soft" : "primary"}
          inactive={event.host || (event.full && !joined)}
          disabled={busy}
          onPress={toggle}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surface },
  body: { paddingHorizontal: 20, paddingTop: 4, paddingBottom: 20, gap: 18 },
  headline: { gap: 8 },
  kicker: { color: colors.brand, textTransform: "uppercase", ...font(800, 12, undefined, 0.08) },
  title: { color: colors.ink, ...font(800, 26, 1.15, -0.02) },
  table: { borderWidth: 1.5, borderColor: colors.lineSoft, borderRadius: 16 },
  row: { flexDirection: "row", gap: 12, paddingHorizontal: 14, paddingVertical: 13 },
  rowDivider: { borderBottomWidth: 1, borderBottomColor: colors.lineSoft },
  rowKey: { width: 52, color: colors.muted, ...font(700, 14) },
  rowValue: { flex: 1, color: colors.ink, ...font(700, 14) },
  desc: { color: colors.body, ...font(500, 14.5, 1.55) },
  host: { backgroundColor: colors.canvas, borderRadius: 18, paddingHorizontal: 16, paddingVertical: 14, gap: 12 },
  hostRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  anon: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.anon, alignItems: "center", justifyContent: "center" },
  anonText: { color: colors.faint, ...font(800, 14) },
  hostTitle: { color: colors.ink, ...font(800, 14) },
  hostSub: { color: colors.muted, ...font(500, 12.5) },
  capacity: { gap: 6 },
  capacityRow: { flexDirection: "row", justifyContent: "space-between" },
  capacityText: { color: colors.ink, ...font(700, 13) },
  bar: { height: 8, borderRadius: 4, backgroundColor: colors.line, overflow: "hidden" },
  barFill: { height: "100%", backgroundColor: colors.brand },
  footer: { paddingHorizontal: 20, paddingVertical: 12, borderTopWidth: 1, borderTopColor: colors.lineSoft },
});
