import { router } from "expo-router";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Avatar, AVATAR_SHAPES, ChipRow, Icon } from "@/components/ui";
import { selectMe, useAppStore } from "@/store";
import { brutal, colors, font } from "@/theme";

type ChipOption = { label: string; active: boolean; onPress: () => void };

type Props = {
  placeholder: string;
  query: string;
  onQueryChange: (query: string) => void;
  /** Magnifier or the keyboard's search key: show the results sheet */
  onSearch: () => void;
  /** Market only: "Search by image" */
  onImageSearch?: () => void;
  chips: ChipOption[];
  /** Recenter and the bottom buttons hide while a sheet is open */
  sheetOpen: boolean;
  onRecenter: () => void;
  /** "List of rooms" / "List of items" / "List of events" */
  listLabel: string;
  onList: () => void;
  /** "List a room" / "Sell" / "Host" */
  action: { label: string; onPress: () => void };
};

// Floating controls over the full-bleed map: search, your avatar, filter chips,
// recenter, the list switch and the tab's main action
export default function MapChrome(props: Props) {
  const { query, onQueryChange, onSearch, onImageSearch, sheetOpen } = props;
  const insets = useSafeAreaInsets();
  const { state } = useAppStore();
  const me = selectMe(state);

  return (
    <>
      <View style={[styles.top, { top: insets.top + 10 }]}>
        <View style={styles.search}>
          <Pressable onPress={onSearch} accessibilityRole="button" accessibilityLabel="Search" style={styles.round}>
            <Icon name="search" size={20} color={colors.brand} strokeWidth={2.6} />
          </Pressable>
          <TextInput
            value={query}
            onChangeText={onQueryChange}
            onSubmitEditing={onSearch}
            placeholder={props.placeholder}
            placeholderTextColor={colors.faint}
            returnKeyType="search"
            autoCorrect={false}
            style={styles.input}
          />
          {query.length > 0 && (
            <Pressable
              onPress={() => onQueryChange("")}
              accessibilityRole="button"
              accessibilityLabel="Clear search"
              hitSlop={6}
              style={styles.clear}
            >
              <Icon name="close" size={18} color={colors.muted} />
            </Pressable>
          )}
          {onImageSearch && (
            <Pressable
              onPress={onImageSearch}
              accessibilityRole="button"
              accessibilityLabel="Search by image"
              style={[styles.round, styles.imageButton]}
            >
              <Icon name="imageSearch" size={21} color={colors.brand} strokeWidth={2.1} />
            </Pressable>
          )}
        </View>
        <Pressable
          onPress={() => router.push("/profile")}
          accessibilityRole="button"
          accessibilityLabel="Profile"
          style={[styles.me, { borderRadius: 52 * AVATAR_SHAPES[me.avatarStyle?.shape ?? "circle"] }]}
        >
          <Avatar index={me.avatar} nick={me.nick} url={me.avatarUrl} look={me.avatarStyle} size={48} />
        </Pressable>
      </View>

      <View style={[styles.chips, { top: insets.top + 68 }]}>
        <ChipRow options={props.chips} floating height={34} inset={12} />
      </View>

      {!sheetOpen && (
        <>
          <Pressable
            onPress={props.onRecenter}
            accessibilityRole="button"
            accessibilityLabel="Recenter map"
            style={styles.recenter}
          >
            <Icon name="crosshair" size={24} color={colors.brand} strokeWidth={2.2} />
          </Pressable>
          <View style={styles.bottom}>
            <Pressable onPress={props.onList} accessibilityRole="button" style={styles.listButton}>
              <Icon name="list" size={18} color={colors.brand} />
              <Text style={styles.listText}>{props.listLabel}</Text>
            </Pressable>
            <Pressable
              onPress={props.action.onPress}
              accessibilityRole="button"
              style={({ pressed }) => [styles.action, pressed && { backgroundColor: colors.brandPressed }]}
            >
              <Icon name="plus" size={18} color={colors.surface} />
              <Text style={styles.actionText}>{props.action.label}</Text>
            </Pressable>
          </View>
        </>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  top: { position: "absolute", left: 12, right: 12, zIndex: 6, flexDirection: "row", gap: 10 },
  search: {
    flex: 1,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.surface,
    ...brutal(4),
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingLeft: 4,
    paddingRight: 6,
  },
  round: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  input: { flex: 1, minWidth: 0, height: 44, color: colors.ink, ...font(500, 15) },
  clear: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  imageButton: { borderLeftWidth: 2, borderLeftColor: colors.brandSoft, borderRadius: 0 },
  // The avatar's own shape sits inside the brutal frame
  me: { width: 52, height: 52, overflow: "hidden", ...brutal(4), alignItems: "center", justifyContent: "center" },
  chips: { position: "absolute", left: 0, right: 0, zIndex: 6 },
  recenter: {
    position: "absolute",
    right: 14,
    bottom: 86,
    zIndex: 6,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.surface,
    ...brutal(4),
    alignItems: "center",
    justifyContent: "center",
  },
  bottom: {
    position: "absolute",
    left: 14,
    right: 14,
    bottom: 18,
    zIndex: 6,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
  },
  listButton: {
    height: 48,
    paddingHorizontal: 18,
    borderRadius: 24,
    backgroundColor: colors.surface,
    ...brutal(4),
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  listText: { color: colors.brand, ...font(700, 14) },
  action: {
    height: 52,
    paddingHorizontal: 20,
    borderRadius: 16,
    backgroundColor: colors.brand,
    ...brutal(4),
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  actionText: { color: colors.surface, ...font(800, 14.5) },
});
