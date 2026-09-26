import { router } from "expo-router";
import { useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { Button, Icon } from "@/components/ui";
import { CampusMap, MapHint, MapMarker } from "@/features/map";
import TabScreen from "@/features/shell/TabScreen";
import type { TabView } from "@/features/shell/ViewToolbar";
import { useAppStore } from "@/store";
import { colors, font } from "@/theme";
import EventPin from "./EventPin";
import { EventCard, EventSheet } from "./EventViews";

const openHost = () => router.push("/meetups/new");

export default function MeetupsTab() {
  const { state } = useAppStore();
  const [view, setView] = useState<TabView>("map");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = state.events.find((e) => e.id === selectedId);

  return (
    <TabScreen
      title="Meetups"
      action={{ label: "Host", onPress: openHost }}
      view={view}
      onViewChange={(v) => {
        setView(v);
        setSelectedId(null);
      }}
    >
      {view === "map" ? (
        <CampusMap
          onBackgroundPress={() => setSelectedId(null)}
          overlay={
            <>
              <MapHint text="Walk-in events · host & guests hidden" />
              {selected && <EventSheet key={selected.id} event={selected} />}
            </>
          }
        >
          {state.events.map((e) => (
            <MapMarker key={e.id} x={e.where.x} y={e.where.y}>
              <EventPin event={e} selected={e.id === selectedId} onPress={() => setSelectedId(e.id)} />
            </MapMarker>
          ))}
        </CampusMap>
      ) : (
        <ScrollView contentContainerStyle={styles.list}>
          <View style={styles.banner}>
            <Text style={styles.bannerTitle}>Just walk in.</Text>
            <Text style={styles.bannerText}>
              Anyone can host. Hosts and guests stay anonymous — you only see a headcount.
            </Text>
            <Button
              label="Host an event"
              variant="yellow"
              size="sm"
              icon={<Icon name="plus" size={16} color={colors.ink} />}
              onPress={openHost}
              style={styles.bannerButton}
            />
          </View>
          {state.events.map((e) => (
            <EventCard key={e.id} event={e} />
          ))}
        </ScrollView>
      )}
    </TabScreen>
  );
}

const styles = StyleSheet.create({
  list: { paddingHorizontal: 18, paddingTop: 16, paddingBottom: 24, gap: 14 },
  banner: { backgroundColor: colors.ink, borderRadius: 22, padding: 18, gap: 10 },
  bannerTitle: { color: colors.surface, ...font(800, 19, 1.25) },
  bannerText: { color: colors.brandLight, ...font(500, 13.5, 1.45) },
  bannerButton: { alignSelf: "flex-start", height: 42, borderRadius: 12 },
});
