import { router } from "expo-router";
import { useState } from "react";
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRefreshOnFocus } from "@/api/hooks";
import { ChipRow, GamePressable, Icon } from "@/components/ui";
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
import { countMeetupFilters, EMPTY_MEETUP_FILTERS, filterEvents, type MeetupFilters } from "./logic";
import MeetupFiltersSheet from "./MeetupFiltersSheet";
import Recommended from "./Recommended";
import ReminderBanners from "./ReminderBanners";

const openHost = () => router.push("/meetups/new");
const openEvent = (id: string) => router.push({ pathname: "/meetups/[id]", params: { id } });

/** Stand-in thumbnail for event results (events have no photos) */
/** Type chips in the design's order */
const TYPE_CHIPS: MeetupFilters["categories"] = ["Study", "Social", "Casual", "Food"];

const EVENT_THUMB = "https://images.unsplash.com/photo-1523580494863-6f3031224c94?w=200&h=200&q=60&auto=format&fit=crop";

function emptyText(goingOnly: boolean, goingCount: number, total: number): string {
  if (goingOnly && goingCount === 0) return "You haven't joined any meetups yet. Tap Join on an event to add it here.";
  return total ? "No meetups match your search or filters." : "No meetups this week yet. Host the first one!";
}

export default function MeetupsTab() {
  const { state, actions } = useAppStore();
  const { refreshing, refresh } = useRefreshOnFocus(actions.loadEvents);
  const [view, setView] = useState<TabView>("map");
  const [filters, setFilters] = useState<MeetupFilters>(EMPTY_MEETUP_FILTERS);
  const [filtersOpen, setFiltersOpen] = useState(false);
  // "Going": only the events you've joined, on both the map and the list
  const [goingOnly, setGoingOnly] = useState(false);
  const { mapRef, recenter, ...search } = useMapSearch<"event">();
  const selectedId = search.selected("event");
  const selected = state.events.find((e) => e.id === selectedId);

  // One search and one set of filters for both the map and the list
  const goingCount = state.events.filter((e) => e.joined).length;
  const searched = state.events.filter(
    (e) => (!goingOnly || e.joined) && matchesQuery(search.query, e.title, e.where.name),
  );
  const events = filterEvents(searched, filters);
  const filterCount = countMeetupFilters(filters);
  const setCategories = (categories: MeetupFilters["categories"]) => {
    setFilters({ ...filters, categories });
    search.setSheet(null);
  };
  // Quick type chips (the same types the dialog sets)
  const typeChips = [
    { label: "All", active: filters.categories.length === 0, onPress: () => setCategories([]) },
    ...TYPE_CHIPS.map((c) => ({
      label: c,
      active: filters.categories.includes(c),
      onPress: () =>
        setCategories(filters.categories.includes(c) ? filters.categories.filter((x) => x !== c) : [...filters.categories, c]),
    })),
  ];
  // On the map: Going, the dialog, then the type chips
  const chips = [
    {
      label: `Going · ${goingCount}`,
      active: goingOnly,
      onPress: () => {
        setGoingOnly(!goingOnly);
        search.setSheet(null);
      },
    },
    ...typeChips,
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
                  emptyText={`No matches for “${search.query.trim()}”, mate. Try another word or clear filters.`}
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
            <GamePressable
              kind="sm"
              onPress={openHost}
              accessibilityRole="button"
              style={styles.bannerButton}
              faceStyle={(pressed) => [styles.bannerButtonFace, pressed && { backgroundColor: colors.yellowPressed }]}
            >
              <Icon name="plus" size={16} color={colors.ink} strokeWidth={3} />
              <Text style={styles.bannerButtonText}>Host an event</Text>
            </GamePressable>
          </View>
          <View style={styles.viewPicker}>
            <View style={styles.segments}>
              {[
                { going: false, label: "All events" },
                { going: true, label: `Going · ${goingCount}` },
              ].map((o) => {
                const active = o.going === goingOnly;
                const label = <Text style={[styles.segmentText, active && styles.segmentTextActive]}>{o.label}</Text>;
                return active ? (
                  <GamePressable
                    key={o.label}
                    kind="sm"
                    onPress={() => setGoingOnly(o.going)}
                    accessibilityRole="button"
                    accessibilityState={{ selected: true }}
                    style={styles.segmentCell}
                    faceStyle={[styles.segment, styles.segmentActive]}
                  >
                    {label}
                  </GamePressable>
                ) : (
                  <Pressable
                    key={o.label}
                    onPress={() => setGoingOnly(o.going)}
                    accessibilityRole="button"
                    accessibilityState={{ selected: false }}
                    style={[styles.segmentCell, styles.segment]}
                  >
                    {label}
                  </Pressable>
                );
              })}
            </View>
            <View style={styles.typeChips}>
              <ChipRow options={typeChips} height={34} />
            </View>
          </View>
          <ListSearchBar
            query={search.query}
            onQueryChange={search.setQuery}
            placeholder="Search meetups or places"
            filterCount={filterCount}
            onFilters={() => setFiltersOpen(true)}
          />
          <ReminderBanners events={state.events} />
          {!goingOnly && <Recommended events={state.events} />}
          {goingOnly && (
            <View style={styles.goingHead}>
              <Text style={styles.goingTitle}>Your meetups</Text>
              <Text style={styles.goingText}>Choose when UCompass reminds you, then add it to your calendar.</Text>
            </View>
          )}
          {events.map((e) => (
            <EventCard key={e.id} event={e} showReminders={goingOnly} />
          ))}
          {events.length === 0 && !refreshing && <Text style={styles.empty}>{emptyText(goingOnly, goingCount, state.events.length)}</Text>}
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

/** The All events / Going track (design colour, no token) */
const SEGMENT_TRACK = "#F0F3FA";

const styles = StyleSheet.create({
  list: { paddingHorizontal: 18, paddingTop: 16, paddingBottom: 24, gap: 14 },
  banner: { backgroundColor: colors.ink, borderRadius: 22, padding: 18, gap: 10 },
  bannerTitle: { color: colors.surface, ...font(800, 19, 1.25) },
  bannerText: { color: colors.brandLight, ...font(500, 13.5, 1.45) },
  // Its ink border and ledge melt into the ink card, like the design
  bannerButton: { alignSelf: "flex-start" },
  bannerButtonFace: {
    height: 42,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: colors.yellow,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  bannerButtonText: { color: colors.ink, ...font(800, 14) },
  viewPicker: { gap: 10 },
  segments: { flexDirection: "row", gap: 4, padding: 4, borderRadius: 14, backgroundColor: SEGMENT_TRACK },
  segmentCell: { flex: 1 },
  segment: { height: 40, borderRadius: 11, alignItems: "center", justifyContent: "center" },
  segmentActive: { backgroundColor: colors.yellow },
  segmentText: { color: colors.muted, ...font(700, 13.5) },
  segmentTextActive: { color: colors.ink },
  // Full-bleed scroll; room above and below for the chips' ledge
  typeChips: { marginHorizontal: -18, paddingTop: 2, paddingBottom: 3 },
  goingHead: { gap: 3 },
  goingTitle: { color: colors.ink, ...font(800, 15) },
  goingText: { color: colors.muted, ...font(500, 12.5, 1.45) },
  empty: { textAlign: "center", padding: 30, color: colors.muted, ...font(600, 14) },
});
