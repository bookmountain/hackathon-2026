import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRefreshOnFocus } from "@/api/hooks";
import { ChipRow } from "@/components/ui";
import { CampusMap, MapChrome, MapMarker, ResultsSheet } from "@/features/map";
import { useMapSearch } from "@/features/map/useMapSearch";
import { matchesQuery, resultsTitle } from "@/features/search/query";
import TabScreen from "@/features/shell/TabScreen";
import type { TabView } from "@/features/shell/ViewToolbar";
import { useAppStore } from "@/store";
import { colors, font } from "@/theme";
import FlatCard from "./FlatCard";
import FlatPin from "./FlatPin";
import FlatSheet from "./FlatSheet";
import { FLAT_FILTERS, filterFlats, type FlatFilter } from "./logic";

const openFlat = (id: string) => router.push({ pathname: "/flats/[id]", params: { id } });
const listRoom = () => router.push("/flats/new");

export default function FlatsTab() {
  const { state, actions } = useAppStore();
  const { refreshing, refresh } = useRefreshOnFocus(actions.loadFlats);
  // Set by "List a room" after publishing, to show the new room on the map
  const { focus } = useLocalSearchParams<{ focus?: string }>();
  const [handledFocus, setHandledFocus] = useState<string | undefined>();
  const [view, setView] = useState<TabView>("map");
  const [filters, setFilters] = useState<FlatFilter[]>([]);
  const { mapRef, recenter, ...search } = useMapSearch<"flat">();

  if (focus && focus !== handledFocus) {
    setHandledFocus(focus);
    setView("map");
    setFilters([]);
    search.setQuery("");
    search.setSheet({ kind: "flat", id: focus });
  }

  const flats = filterFlats(state.flats, filters);
  // The search box narrows the map and its results; the list shows every match of the chips
  const onMap = flats.filter((f) => matchesQuery(search.query, f.title, f.area));
  const selectedId = search.selected("flat");
  const selected = state.flats.find((f) => f.id === selectedId);
  const chipOptions = FLAT_FILTERS.map((f) => ({
    label: f,
    active: filters.includes(f),
    onPress: () => setFilters(filters.includes(f) ? filters.filter((x) => x !== f) : [...filters, f]),
  }));

  return (
    <TabScreen
      title="Flatmates"
      action={{ label: "List a room", onPress: listRoom }}
      view={view}
      onViewChange={(v) => {
        setView(v);
        search.setSheet(null);
      }}
    >
      {view === "map" ? (
        <CampusMap
          ref={mapRef}
          onBackgroundPress={() => search.setSheet(null)}
          overlay={
            <>
              <MapChrome
                placeholder="Search rooms near campus"
                query={search.query}
                onQueryChange={search.setQuery}
                onSearch={search.showResults}
                chips={chipOptions}
                sheetOpen={!!search.sheet}
                onRecenter={recenter}
                listLabel="List of rooms"
                onList={() => setView("list")}
                action={{ label: "List a room", onPress: listRoom }}
              />
              {search.sheet?.kind === "results" && (
                <ResultsSheet
                  title={resultsTitle(onMap.length, "room", search.query)}
                  onClose={() => search.setSheet(null)}
                  emptyText={`No matches for “${search.query.trim()}”. Try another word or clear filters.`}
                  rows={onMap.map((f) => ({
                    key: f.id,
                    title: f.title,
                    sub: `${f.area} · ${f.beds} bed`,
                    right: `$${f.price}/wk`,
                    image: f.photo,
                    onPress: () => openFlat(f.id),
                  }))}
                />
              )}
              {selected && <FlatSheet key={selected.id} flat={selected} />}
            </>
          }
        >
          {onMap.map((f) => (
            <MapMarker
              key={f.id}
              coordinate={f}
              onPress={() => search.setSheet({ kind: "flat", id: f.id })}
              label={`${f.title}, $${f.price} per week`}
              zIndex={f.id === selectedId ? 10 : 3}
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
            <FlatCard key={f.id} flat={f} onPress={() => openFlat(f.id)} />
          ))}
          {flats.length === 0 && <Text style={styles.empty}>No rooms match those filters.</Text>}
        </ScrollView>
      )}
    </TabScreen>
  );
}

const styles = StyleSheet.create({
  list: { paddingHorizontal: 18, paddingTop: 16, paddingBottom: 24, gap: 16 },
  intro: { gap: 4 },
  title: { color: colors.ink, ...font(800, 22, 1.2, -0.02) },
  subtitle: { color: colors.muted, ...font(500, 13.5) },
  listChips: { marginHorizontal: -18 },
  empty: { textAlign: "center", padding: 30, color: colors.muted, ...font(600, 14) },
});
