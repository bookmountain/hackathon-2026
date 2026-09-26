import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { FlatList, RefreshControl, StyleSheet, TextInput, View } from "react-native";
import { useRefreshOnFocus } from "@/api/hooks";
import { ChipRow, Icon } from "@/components/ui";
import type { Item } from "@/data/types";
import { CampusMap, MapHint, MapMarker } from "@/features/map";
import TabScreen from "@/features/shell/TabScreen";
import type { TabView } from "@/features/shell/ViewToolbar";
import { useAppStore } from "@/store";
import { colors, font } from "@/theme";
import ItemCard from "./ItemCard";
import { CATEGORIES, customPinItems, itemsAtPickup, listItems, type CategoryFilter } from "./logic";
import { ItemTag, PickupPin } from "./MarketPins";
import { ItemSheet, PickupSheet } from "./MarketSheets";

type Selection = { kind: "pickup" | "item"; id: string } | null;

/** Keeps a lone last card at half width in the two-column grid */
function padToPairs(items: Item[]): (Item | null)[] {
  return items.length % 2 ? [...items, null] : items;
}

export default function MarketTab() {
  const { state, actions } = useAppStore();
  const { refreshing, refresh } = useRefreshOnFocus(actions.loadItems);
  // Set by "Sell" after posting, to show every category again
  const { posted } = useLocalSearchParams<{ posted?: string }>();
  const [handledPost, setHandledPost] = useState<string | undefined>();
  const [view, setView] = useState<TabView>("map");
  const [category, setCategory] = useState<CategoryFilter>("All");
  const [query, setQuery] = useState("");
  const [selection, setSelection] = useState<Selection>(null);

  if (posted && posted !== handledPost) {
    setHandledPost(posted);
    setCategory("All");
  }

  const chips = CATEGORIES.map((c) => ({ label: c, active: c === category, onPress: () => setCategory(c) }));
  const selectedPickup = selection?.kind === "pickup" ? state.pickups.find((p) => p.id === selection.id) : undefined;
  const selectedItem = selection?.kind === "item" ? state.items.find((i) => i.id === selection.id) : undefined;

  return (
    <TabScreen
      title="Market"
      action={{ label: "Sell", onPress: () => router.push("/market/new") }}
      view={view}
      onViewChange={(v) => {
        setView(v);
        setSelection(null);
      }}
    >
      {view === "map" ? (
        <CampusMap
          onBackgroundPress={() => setSelection(null)}
          overlay={
            <>
              <View style={styles.chips}>
                <ChipRow options={chips} floating height={34} inset={14} />
              </View>
              <MapHint text="★ Safe pickup points · tags = seller pins" />
              {selectedPickup && (
                <PickupSheet
                  key={selectedPickup.id}
                  pickup={selectedPickup}
                  items={itemsAtPickup(state.items, selectedPickup.id)}
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
              onPress={() => setSelection({ kind: "pickup", id: p.id })}
              label={`${p.name}, safe pickup point`}
            >
              <PickupPin
                count={itemsAtPickup(state.items, p.id, category).length}
                selected={selection?.kind === "pickup" && selection.id === p.id}
              />
            </MapMarker>
          ))}
          {customPinItems(state.items, category).map((i) => (
            <MapMarker
              key={i.id}
              coordinate={i.loc}
              onPress={() => setSelection({ kind: "item", id: i.id })}
              label={`${i.title}, $${i.price}`}
            >
              <ItemTag item={i} selected={selection?.kind === "item" && selection.id === i.id} />
            </MapMarker>
          ))}
        </CampusMap>
      ) : (
        <FlatList
          data={padToPairs(listItems(state.items, category, query))}
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
                  value={query}
                  onChangeText={setQuery}
                  placeholder="Search textbooks, desks, tech…"
                  placeholderTextColor={colors.faint}
                  style={styles.searchInput}
                  returnKeyType="search"
                />
              </View>
              <View style={styles.listChips}>
                <ChipRow options={chips} />
              </View>
            </View>
          }
          renderItem={({ item }) =>
            item ? (
              <ItemCard item={item} onPress={() => router.push({ pathname: "/market/[id]", params: { id: item.id } })} />
            ) : (
              <View style={styles.spacer} />
            )
          }
        />
      )}
    </TabScreen>
  );
}

const styles = StyleSheet.create({
  chips: { position: "absolute", top: 2, left: 0, right: 0, zIndex: 6 },
  list: { paddingHorizontal: 18, paddingTop: 16, paddingBottom: 24, gap: 12 },
  gridRow: { gap: 12 },
  header: { gap: 14, marginBottom: 2 },
  search: {
    height: 46,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
  },
  searchInput: { flex: 1, height: "100%", color: colors.ink, ...font(500, 14.5) },
  listChips: { marginHorizontal: -18 },
  spacer: { flex: 1 },
});
