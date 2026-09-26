import { router } from "expo-router";
import { useState } from "react";
import { RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRefreshOnFocus } from "@/api/hooks";
import { Button, Icon } from "@/components/ui";
import { CampusMap, MapChrome, MapMarker, ResultsSheet } from "@/features/map";
import { useMapSearch } from "@/features/map/useMapSearch";
import { matchesQuery, resultsTitle } from "@/features/search/query";
import TabScreen from "@/features/shell/TabScreen";
import type { TabView } from "@/features/shell/ViewToolbar";
import { useAppStore } from "@/store";
import { colors, font } from "@/theme";
import EventPin from "./EventPin";
import { EventCard, EventSheet } from "./EventViews";
import { MEETUP_FILTERS, type MeetupFilter } from "./logic";

const openHost = () => router.push("/meetups/new");
const openEvent = (id: string) => router.push({ pathname: "/meetups/[id]", params: { id } });

/** Stand-in thumbnail for event results (events have no photos) */
const EVENT_THUMB = "https://images.unsplash.com/photo-1523580494863-6f3031224c94?w=200&h=200&q=60&auto=format&fit=crop";

export default function MeetupsTab() {
  const { state, actions } = useAppStore();
  const { refreshing, refresh } = useRefreshOnFocus(actions.loadEvents);
  const [view, setView] = useState<TabView>("map");
  const [category, setCategory] = useState<MeetupFilter>("All");
  const { mapRef, recenter, ...search } = useMapSearch<"event">();
  const selectedId = search.selected("event");
  const selected = state.events.find((e) => e.id === selectedId);

  // The chips and search narrow the map and its results; the list shows everything
  const onMap = state.events.filter(
    (e) => (category === "All" || e.cat === category) && matchesQuery(search.query, e.title, e.where.name),
  );
  const chips = MEETUP_FILTERS.map((c) => ({
    label: c,
    active: c === category,
    onPress: () => {
      setCategory(c);
      search.setSheet(null);
    },
  }));

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
                  title={resultsTitle(onMap.length, "event", search.query)}
                  onClose={() => search.setSheet(null)}
                  emptyText={`No matches for “${search.query.trim()}”. Try another word or clear filters.`}
                  rows={onMap.map((e) => ({
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
          {onMap.map((e) => (
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
          {state.events.map((e) => (
            <EventCard key={e.id} event={e} />
          ))}
          {state.events.length === 0 && !refreshing && (
            <Text style={styles.empty}>No meetups this week yet. Host the first one!</Text>
          )}
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
  // Borderless on the ink card, like the design
  bannerButton: { alignSelf: "flex-start", height: 42, borderRadius: 12, borderWidth: 0 },
  empty: { textAlign: "center", padding: 30, color: colors.muted, ...font(600, 14) },
});
