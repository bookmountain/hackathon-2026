import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRefreshOnFocus } from "@/api/hooks";
import { ChipRow } from "@/components/ui";
import { CampusMap, MapHint, MapMarker } from "@/features/map";
import TabScreen from "@/features/shell/TabScreen";
import type { TabView } from "@/features/shell/ViewToolbar";
import { useAppStore } from "@/store";
import { colors, font } from "@/theme";
import FlatCard from "./FlatCard";
import FlatPin from "./FlatPin";
import FlatSheet from "./FlatSheet";
import { FLAT_FILTERS, filterFlats, type FlatFilter } from "./logic";

export default function FlatsTab() {
  const { state, actions } = useAppStore();
  const { refreshing, refresh } = useRefreshOnFocus(actions.loadFlats);
  // Set by "List a room" after publishing, to show the new room on the map
  const { focus } = useLocalSearchParams<{ focus?: string }>();
  const [handledFocus, setHandledFocus] = useState<string | undefined>();
  const [view, setView] = useState<TabView>("map");
  const [filters, setFilters] = useState<FlatFilter[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  if (focus && focus !== handledFocus) {
    setHandledFocus(focus);
    setView("map");
    setFilters([]);
    setSelectedId(focus);
  }

  const flats = filterFlats(state.flats, filters);
  const selected = state.flats.find((f) => f.id === selectedId);
  const chipOptions = FLAT_FILTERS.map((f) => ({
    label: f,
    active: filters.includes(f),
    onPress: () => setFilters(filters.includes(f) ? filters.filter((x) => x !== f) : [...filters, f]),
  }));

  return (
    <TabScreen
      title="Flatmates"
      action={{ label: "List a room", onPress: () => router.push("/flats/new") }}
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
              <View style={styles.chips}>
                <ChipRow options={chipOptions} floating height={34} inset={14} />
              </View>
              <MapHint text="Rooms listed by students · tap a price" />
              {selected && <FlatSheet key={selected.id} flat={selected} />}
            </>
          }
        >
          {flats.map((f) => (
            <MapMarker
              key={f.id}
              coordinate={f}
              onPress={() => setSelectedId(f.id)}
              label={`${f.title}, $${f.price} per week`}
            >
              <FlatPin flat={f} selected={f.id === selectedId} />
            </MapMarker>
          ))}
        </CampusMap>
      ) : (
        <ScrollView
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.brand} />}
        >
          <View style={styles.intro}>
            <Text style={styles.title}>Rooms from fellow students</Text>
            <Text style={styles.subtitle}>Every tenant is uni-verified. See who lives there before you message.</Text>
          </View>
          <View style={styles.listChips}>
            <ChipRow options={chipOptions} />
          </View>
          {flats.map((f) => (
            <FlatCard key={f.id} flat={f} onPress={() => router.push({ pathname: "/flats/[id]", params: { id: f.id } })} />
          ))}
          {flats.length === 0 && <Text style={styles.empty}>No rooms match those filters.</Text>}
        </ScrollView>
      )}
    </TabScreen>
  );
}

const styles = StyleSheet.create({
  chips: { position: "absolute", top: 2, left: 0, right: 0, zIndex: 6 },
  list: { paddingHorizontal: 18, paddingTop: 16, paddingBottom: 24, gap: 16 },
  intro: { gap: 4 },
  title: { color: colors.ink, ...font(800, 22, 1.2, -0.02) },
  subtitle: { color: colors.muted, ...font(500, 13.5) },
  listChips: { marginHorizontal: -18 },
  empty: { textAlign: "center", padding: 30, color: colors.muted, ...font(600, 14) },
});
