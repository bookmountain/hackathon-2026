import { router } from "expo-router";
import { useState } from "react";
import { RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRefreshOnFocus } from "@/api/hooks";
import { Button, Icon } from "@/components/ui";
import { CampusMap, MapChrome, MapMarker, ResultsSheet } from "@/features/map";
import ListSearchBar from "@/features/filters/ListSearchBar";
import { useMapSearch } from "@/features/map/useMapSearch";
import { matchesQuery, resultsTitle } from "@/features/search/query";
import TabScreen from "@/features/shell/TabScreen";
import type { TabView } from "@/features/shell/ViewToolbar";
import { useAppStore } from "@/store";
import { colors, font } from "@/theme";
import EventPin from "./EventPin";
import { EventCard, EventSheet } from "./EventViews";
import { countMeetupFilters, EMPTY_MEETUP_FILTERS, EVENT_CATEGORIES, filterEvents, type MeetupFilters } from "./logic";
import MeetupFiltersSheet from "./MeetupFiltersSheet";

const openHost = () => router.push("/meetups/new");
const openEvent = (id: string) => router.push({ pathname: "/meetups/[id]", params: { id } });

/** Stand-in thumbnail for event results (events have no photos) */
const EVENT_THUMB = "https://images.unsplash.com/photo-1523580494863-6f3031224c94?w=200&h=200&q=60&auto=format&fit=crop";

export default function MeetupsTab() {
  const { state, actions } = useAppStore();
  const { refreshing, refresh } = useRefreshOnFocus(actions.loadEvents);
  const [view, setView] = useState<TabView>("map");
  const [filters, setFilters] = useState<MeetupFilters>(EMPTY_MEETUP_FILTERS);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const { mapRef, recenter, ...search } = useMapSearch<"event">();
  const selectedId = search.selected("event");
  const selected = state.events.find((e) => e.id === selectedId);

  // One search and one set of filters for both the map and the list
  const searched = state.events.filter((e) => matchesQuery(search.query, e.title, e.where.name));
  const events = filterEvents(searched, filters);
  const filterCount = countMeetupFilters(filters);
  const setCategories = (categories: MeetupFilters["categories"]) => {
    setFilters({ ...filters, categories });
    search.setSheet(null);
  };
  // On the map: the dialog, then quick type chips (the same types the dialog sets)
  const chips = [
    { label: filterCount ? `Filters · ${filterCount}` : "Filters", active: filterCount > 0, onPress: () => setFiltersOpen(true) },
    { label: "All", active: filters.categories.length === 0, onPress: () => setCategories([]) },
    ...EVENT_CATEGORIES.map((c) => ({
      label: c,
      active: filters.categories.includes(c),
      onPress: () =>
        setCategories(filters.categories.includes(c) ? filters.categories.filter((x) => x !== c) : [...filters.categories, c]),
    })),
  ];

  return (
    <TabScreen
      title="Meetups"
      action={{ label: "Host", onPress: openHost }}
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
                placeholder="Search meetups & events"
                query={search.query}
                onQueryChange={search.setQuery}
                onSearch={search.showResults}
                chips={chips}
                sheetOpen={!!search.sheet}
                onRecenter={recenter}
                listLabel="List of events"
                onList={() => setView("list")}
                action={{ label: "Host", onPress: openHost }}
              />
              {search.sheet?.kind === "results" && (
                <ResultsSheet
                  title={resultsTitle(events.length, "event", search.query)}
                  onClose={() => search.setSheet(null)}
                  emptyText={`No matches for “${search.query.trim()}”. Try another word or clear filters.`}
                  rows={events.map((e) => ({
                    key: e.id,
                    title: e.title,
                    sub: `${e.when} · ${e.where.name}`,
                    right: `${e.going} going`,
                    image: EVENT_THUMB,
                    onPress: () => openEvent(e.id),
                  }))}
                />
              )}
              {selected && <EventSheet key={selected.id} event={selected} />}
            </>
          }
        >
          {events.map((e) => (
            <MapMarker
              key={e.id}
              coordinate={e.where}
              onPress={() => search.setSheet({ kind: "event", id: e.id })}
              label={e.title}
              zIndex={e.id === selectedId ? 10 : 3}
            >
              <EventPin event={e} selected={e.id === selectedId} />
            </MapMarker>
          ))}
        </CampusMap>
      ) : (
        <ScrollView
          contentContainerStyle={styles.list}
          keyboardShouldPersistTaps="handled"
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.brand} />}
        >
          <View style={styles.banner}>
            <Text style={styles.bannerTitle}>Just walk in.</Text>
            <Text style={styles.bannerText}>
              Anyone can host. Hosts and guests stay anonymous — you only see a headcount.
            </Text>
            <Button
              label="Host an event"
              variant="yellow"
              shadow={0}
              size="sm"
              icon={<Icon name="plus" size={16} color={colors.ink} />}
              onPress={openHost}
              style={styles.bannerButton}
            />
          </View>
          <ListSearchBar
            query={search.query}
            onQueryChange={search.setQuery}
            placeholder="Search meetups or places"
            filterCount={filterCount}
            onFilters={() => setFiltersOpen(true)}
          />
          {events.map((e) => (
            <EventCard key={e.id} event={e} />
          ))}
          {events.length === 0 && !refreshing && (
            <Text style={styles.empty}>
              {state.events.length ? "No meetups match your search or filters." : "No meetups this week yet. Host the first one!"}
            </Text>
          )}
        </ScrollView>
      )}
      {filtersOpen && (
        <MeetupFiltersSheet
          events={searched}
          applied={filters}
          onApply={(next) => {
            setFilters(next);
            setFiltersOpen(false);
            search.setSheet(null);
          }}
          onClose={() => setFiltersOpen(false)}
        />
      )}
    </TabScreen>
  );
}

const styles = StyleSheet.create({
  list: { paddingHorizontal: 18, paddingTop: 16, paddingBottom: 24, gap: 14 },
  banner: { backgroundColor: colors.ink, borderRadius: 22, padding: 18, gap: 10 },
  bannerTitle: { color: colors.surface, ...font(800, 19, 1.25) },
  bannerText: { color: colors.brandLight, ...font(500, 13.5, 1.45) },
  // Borderless on the ink card, like the design
  bannerButton: { alignSelf: "flex-start", height: 42, borderRadius: 12, borderWidth: 0 },
  empty: { textAlign: "center", padding: 30, color: colors.muted, ...font(600, 14) },
});
