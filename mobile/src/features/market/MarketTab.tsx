import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, FlatList, Image, Pressable, RefreshControl, StyleSheet, Text, TextInput, View } from "react-native";
import { useRefreshOnFocus } from "@/api/hooks";
import { ChipRow, Icon } from "@/components/ui";
import type { Item } from "@/data/types";
import { CampusMap, MapChrome, MapMarker, ResultsSheet, type ResultRow } from "@/features/map";
import { useMapSearch } from "@/features/map/useMapSearch";
import { imageSearchStatus } from "@/features/search/imageSearch";
import { matchesQuery, resultsTitle } from "@/features/search/query";
import { useImageSearch, type ImageQuery } from "@/features/search/useImageSearch";
import TabScreen from "@/features/shell/TabScreen";
import type { TabView } from "@/features/shell/ViewToolbar";
import { useAppStore } from "@/store";
import { brutal, colors, font } from "@/theme";
import ItemCard from "./ItemCard";
import { CATEGORIES, customPinItems, inCategory, isSold, itemsAtPickup, listItems, type CategoryFilter } from "./logic";
import { ItemTag, PickupPin } from "./MarketPins";
import { ItemSheet, PickupSheet } from "./MarketSheets";
import PickedForYou from "./PickedForYou";

const openItem = (id: string) => router.push({ pathname: "/market/[id]", params: { id } });
const sell = () => router.push("/market/new");

/** Keeps a lone last card at half width in the two-column grid */
function padToPairs(items: Item[]): (Item | null)[] {
  return items.length % 2 ? [...items, null] : items;
}

function itemRow(i: Item, sub: string): ResultRow {
  return { key: i.id, title: i.title, sub, right: `$${i.price}`, image: i.photo, onPress: () => openItem(i.id) };
}

// "Searching by image" strip at the top of the results sheet
function ImageQueryHeader({ query, onClear }: { query: ImageQuery; onClear: () => void }) {
  return (
    <View style={styles.imgHead}>
      <Image source={{ uri: query.src }} style={styles.imgThumb} accessibilityIgnoresInvertColors />
      <View style={styles.imgText}>
        <Text style={styles.imgTitle}>Searching by image</Text>
        <View style={styles.imgStatusRow}>
          {query.loading && <ActivityIndicator size="small" color={colors.brand} />}
          <Text style={[styles.imgStatus, { color: query.loading ? colors.brand : colors.success }]}>
            {imageSearchStatus(query.loading, query.category)}
          </Text>
        </View>
      </View>
      <Pressable onPress={onClear} accessibilityRole="button" style={styles.imgClear}>
        <Text style={styles.imgClearText}>Clear</Text>
      </Pressable>
    </View>
  );
}

export default function MarketTab() {
  const { state, actions } = useAppStore();
  const { refreshing, refresh } = useRefreshOnFocus(actions.loadItems);
  // Set by "Sell" after posting, to show every category again
  const { posted } = useLocalSearchParams<{ posted?: string }>();
  const [handledPost, setHandledPost] = useState<string | undefined>();
  const [view, setView] = useState<TabView>("map");
  const [category, setCategory] = useState<CategoryFilter>("All");
  const [listQuery, setListQuery] = useState("");
  const { mapRef, recenter, ...search } = useMapSearch<"pickup" | "item">();
  const { imageQuery, startImageSearch, clearImageSearch } = useImageSearch(state.items, state.pickups);

  if (posted && posted !== handledPost) {
    setHandledPost(posted);
    setCategory("All");
  }

  const searchByImage = async () => {
    if (!(await startImageSearch())) return;
    setView("map");
    setCategory("All");
    search.setQuery("");
    search.showResults();
  };

  const chips = CATEGORIES.map((c) => ({
    label: c,
    active: c === category,
    onPress: () => setCategory(c),
  }));
  // Map pins and results: unsold, in the category, matching the search
  const shown = (i: Item) => !isSold(i) && inCategory(i, category) && matchesQuery(search.query, i.title);
  const selectedPickupId = search.selected("pickup");
  const selectedItemId = search.selected("item");
  const selectedPickup = state.pickups.find((p) => p.id === selectedPickupId);
  const selectedItem = state.items.find((i) => i.id === selectedItemId);

  const imageResults = imageQuery && !imageQuery.loading ? imageQuery.results : [];
  const results = imageQuery
    ? imageResults.map((i) => itemRow(i, `${i.cat} · ${i.loc.name}`))
    : state.items.filter(shown).map((i) => itemRow(i, `${i.avail} · ${i.loc.name}`));

  return (
    <TabScreen
      title="Market"
      action={{ label: "Sell", onPress: sell }}
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
                placeholder="Search items"
                query={search.query}
                onQueryChange={(q) => {
                  // Typing a word replaces a search by image
                  if (q) clearImageSearch();
                  search.setQuery(q);
                }}
                onSearch={search.showResults}
                onImageSearch={searchByImage}
                chips={chips}
                sheetOpen={!!search.sheet}
                onRecenter={recenter}
                listLabel="List of items"
                onList={() => setView("list")}
                action={{ label: "Sell", onPress: sell }}
              />
              {search.sheet?.kind === "results" && (
                <ResultsSheet
                  header={
                    imageQuery && (
                      <ImageQueryHeader
                        query={imageQuery}
                        onClear={() => {
                          clearImageSearch();
                          search.setSheet(null);
                        }}
                      />
                    )
                  }
                  title={resultsTitle(results.length, "item", search.query, imageQuery ?? undefined)}
                  onClose={() => search.setSheet(null)}
                  emptyText={
                    imageQuery?.loading ? null : `No matches for “${search.query.trim()}”, mate. Try another word or clear filters.`
                  }
                  rows={results}
                />
              )}
              {selectedPickup && (
                <PickupSheet
                  key={selectedPickup.id}
                  pickup={selectedPickup}
                  items={itemsAtPickup(state.items, selectedPickup.id)}
                  onClose={() => search.setSheet(null)}
                />
              )}
              {selectedItem && <ItemSheet key={selectedItem.id} item={selectedItem} />}
            </>
          }
        >
          {state.pickups.map((p) => (
            <MapMarker
              key={p.id}
              coordinate={p}
              onPress={() => search.setSheet({ kind: "pickup", id: p.id })}
              label={`${p.name}, safe pickup point`}
              zIndex={p.id === selectedPickupId ? 10 : 3}
            >
              <PickupPin
                count={itemsAtPickup(state.items, p.id, category).filter(shown).length}
                selected={p.id === selectedPickupId}
              />
            </MapMarker>
          ))}
          {customPinItems(state.items, category)
            .filter(shown)
            .map((i) => (
              <MapMarker
                key={i.id}
                coordinate={i.loc}
                onPress={() => search.setSheet({ kind: "item", id: i.id })}
                label={`${i.title}, $${i.price}`}
                zIndex={i.id === selectedItemId ? 10 : 3}
              >
                <ItemTag item={i} selected={i.id === selectedItemId} />
              </MapMarker>
            ))}
        </CampusMap>
      ) : (
        <FlatList
          data={padToPairs(listItems(state.items, category, listQuery))}
          keyExtractor={(i, index) => i?.id ?? `spacer-${index}`}
          numColumns={2}
          columnWrapperStyle={styles.gridRow}
          contentContainerStyle={styles.list}
          keyboardShouldPersistTaps="handled"
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.brand} />}
          ListHeaderComponent={
            <View style={styles.header}>
              <View style={styles.search}>
                <Icon name="search" size={18} color={colors.faint} />
                <TextInput
                  value={listQuery}
                  onChangeText={setListQuery}
                  placeholder="Search textbooks, desks, tech…"
                  placeholderTextColor={colors.faint}
                  style={styles.searchInput}
                  returnKeyType="search"
                />
                <Pressable
                  onPress={searchByImage}
                  accessibilityRole="button"
                  accessibilityLabel="Search by image"
                  style={styles.imageButton}
                >
                  <Icon name="imageSearch" size={21} color={colors.brand} strokeWidth={2.1} />
                </Pressable>
              </View>
              <View style={styles.listChips}>
                <ChipRow options={chips} />
              </View>
              {/* Hidden while searching, so the results come first */}
              {!listQuery.trim() && <PickedForYou items={state.items} onOpen={openItem} />}
            </View>
          }
          renderItem={({ item }) =>
            item ? <ItemCard item={item} onPress={() => openItem(item.id)} /> : <View style={styles.spacer} />
          }
        />
      )}
    </TabScreen>
  );
}

const styles = StyleSheet.create({
  list: { paddingHorizontal: 18, paddingTop: 16, paddingBottom: 24, gap: 12 },
  gridRow: { gap: 12 },
  header: { gap: 14, marginBottom: 2 },
  search: {
    height: 46,
    borderRadius: 14,
    ...brutal(0),
    backgroundColor: colors.surface,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingLeft: 14,
    paddingRight: 6,
  },
  searchInput: { flex: 1, height: "100%", color: colors.ink, ...font(500, 14.5) },
  imageButton: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  listChips: { marginHorizontal: -18 },
  spacer: { flex: 1 },
  imgHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: colors.canvas,
    borderRadius: 16,
    padding: 8,
  },
  imgThumb: { width: 52, height: 52, borderRadius: 12, backgroundColor: colors.brandSofter },
  imgText: { flex: 1, minWidth: 0, gap: 2 },
  imgTitle: { color: colors.ink, ...font(800, 13.5) },
  imgStatusRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  imgStatus: { ...font(600, 12) },
  imgClear: { backgroundColor: colors.surface, borderRadius: 999, paddingHorizontal: 11, paddingVertical: 6 },
  imgClearText: { color: colors.brand, ...font(700, 12) },
});
