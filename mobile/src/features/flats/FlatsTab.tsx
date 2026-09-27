import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRefreshOnFocus } from "@/api/hooks";
import EmptyState from "@/components/feedback/EmptyState";
import { CampusMap, MapChrome, MapMarker, ResultsSheet } from "@/features/map";
import ListSearchBar from "@/features/filters/ListSearchBar";
import { useMapSearch } from "@/features/map/useMapSearch";
import { matchesQuery, resultsTitle } from "@/features/search/query";
import TabScreen from "@/features/shell/TabScreen";
import type { TabView } from "@/features/shell/ViewToolbar";
import { useAppStore } from "@/store";
import { colors, font } from "@/theme";
import FlatCard from "./FlatCard";
import FlatFiltersSheet from "./FlatFiltersSheet";
import FlatPin from "./FlatPin";
import FlatSheet from "./FlatSheet";
import { activeFlatFilters, EMPTY_FLAT_FILTERS, filterFlats, type FlatFilters } from "./logic";

const openFlat = (id: string) => router.push({ pathname: "/flats/[id]", params: { id } });
const listRoom = () => router.push("/flats/new");

export default function FlatsTab() {
  const { state, actions } = useAppStore();
  const { refreshing, refresh } = useRefreshOnFocus(actions.loadFlats);
  // Set by "List a room" after publishing, to show the new room on the map
  const { focus } = useLocalSearchParams<{ focus?: string }>();
  const [handledFocus, setHandledFocus] = useState<string | undefined>();
  const [view, setView] = useState<TabView>("map");
  const [filters, setFilters] = useState<FlatFilters>(EMPTY_FLAT_FILTERS);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const { mapRef, recenter, ...search } = useMapSearch<"flat">();

  if (focus && focus !== handledFocus) {
    setHandledFocus(focus);
    setView("map");
    setFilters(EMPTY_FLAT_FILTERS);
    search.setQuery("");
    search.setSheet({ kind: "flat", id: focus });
  }

  // One search and one set of filters for both the map and the list
  const searched = state.flats.filter((f) => matchesQuery(search.query, f.title, f.area));
  const flats = filterFlats(searched, filters);
  const active = activeFlatFilters(filters);
  const filterCount = active.length;
  const selectedId = search.selected("flat");
  const selected = state.flats.find((f) => f.id === selectedId);
  const openFilters = () => {
    search.setSheet(null);
    setFiltersOpen(true);
  };
  // On the map: the sheet, then one chip per active filter that clears it
  const chipOptions = [
    { label: filterCount ? `Filters · ${filterCount}` : "Filters", active: true, onPress: openFilters },
    ...active.map((c) => ({
      label: `${c.label}  ✕`,
      active: false,
      removable: true,
      onPress: () => {
        search.setSheet(null);
        setFilters({ ...filters, ...c.clear });
      },
    })),
  ];

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
                  title={resultsTitle(flats.length, "room", search.query)}
                  onClose={() => search.setSheet(null)}
                  emptyText={`No matches for “${search.query.trim()}”, mate. Try another word or clear filters.`}
                  rows={flats.map((f) => ({
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
          {flats.map((f) => (
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
          keyboardShouldPersistTaps="handled"
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.brand} />}
        >
          <View style={styles.intro}>
            <Text style={styles.title}>Rooms from fellow students</Text>
            <Text style={styles.subtitle}>Every tenant is uni-verified. See who lives there before you message.</Text>
          </View>
          <ListSearchBar
            query={search.query}
            onQueryChange={search.setQuery}
            placeholder="Search rooms or suburbs"
            filterCount={filterCount}
            onFilters={openFilters}
          />
          {flats.map((f) => (
            <FlatCard key={f.id} flat={f} onPress={() => openFlat(f.id)} />
          ))}
          {flats.length === 0 && (
            <EmptyState sticker="roo" title="Strewth, no rooms here!" text="No rooms match those filters. Try loosening them." />
          )}
        </ScrollView>
      )}
      {filtersOpen && (
        <FlatFiltersSheet filters={filters} onChange={setFilters} count={flats.length} onClose={() => setFiltersOpen(false)} />
      )}
    </TabScreen>
  );
}

const styles = StyleSheet.create({
  list: { paddingHorizontal: 18, paddingTop: 16, paddingBottom: 24, gap: 16 },
  intro: { gap: 4 },
  title: { color: colors.ink, ...font(800, 22, 1.2, -0.02) },
  subtitle: { color: colors.muted, ...font(500, 13.5) },
});
