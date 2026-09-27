import { router } from "expo-router";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Avatar, AVATAR_SHAPES, ChipRow, GamePressable, Icon } from "@/components/ui";
import { selectMe, useAppStore } from "@/store";
import { colors, font } from "@/theme";

type ChipOption = { label: string; active: boolean; removable?: boolean; onPress: () => void };

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

/** Your avatar button, top right */
const ME = 52;

// Floating controls over the full-bleed map: search, your avatar, filter chips,
// recenter, the list switch and the tab's main action
export default function MapChrome(props: Props) {
  const { query, onQueryChange, onSearch, onImageSearch, sheetOpen } = props;
  const insets = useSafeAreaInsets();
  const { state } = useAppStore();
  const me = selectMe(state);
  const shape = me.avatarStyle?.shape ?? "Circle";

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
        <GamePressable
          // The design's game look: round button when the avatar is a circle, a big button otherwise
          kind={shape === "Circle" ? "round" : "cta"}
          onPress={() => router.push("/profile")}
          accessibilityRole="button"
          accessibilityLabel="Profile"
          faceStyle={[styles.me, { borderRadius: ME * AVATAR_SHAPES[shape] }]}
        >
          <Avatar index={me.avatar} nick={me.nick} url={me.avatarUrl} look={me.avatarStyle} size={ME - 5} />
        </GamePressable>
      </View>

      <View style={[styles.chips, { top: insets.top + 68 }]}>
        <ChipRow options={props.chips} floating height={34} inset={12} />
      </View>

      {!sheetOpen && (
        <>
          <GamePressable
            kind="round"
            onPress={props.onRecenter}
            accessibilityRole="button"
            accessibilityLabel="Recenter map"
            style={styles.recenterSpot}
            faceStyle={styles.recenter}
          >
            <Icon name="crosshair" size={24} color={colors.brand} strokeWidth={2.2} />
          </GamePressable>
          <View style={styles.bottom}>
            <GamePressable kind="cta" onPress={props.onList} accessibilityRole="button" faceStyle={styles.listButton}>
              <Icon name="list" size={18} color={colors.brand} />
              <Text style={styles.listText}>{props.listLabel}</Text>
            </GamePressable>
            <GamePressable
              kind="cta"
              onPress={props.action.onPress}
              accessibilityRole="button"
              faceStyle={(pressed) => [styles.action, pressed && { backgroundColor: colors.brandPressed }]}
            >
              <Icon name="plus" size={18} color={colors.surface} />
              <Text style={styles.actionText}>{props.action.label}</Text>
            </GamePressable>
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
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingLeft: 6,
    paddingRight: 8,
  },
  round: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  input: { flex: 1, minWidth: 0, height: 44, color: colors.ink, ...font(500, 15) },
  clear: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  imageButton: { borderLeftWidth: 2, borderLeftColor: colors.brandSoft, borderRadius: 0 },
  // The avatar fills the bordered face
  me: {
    width: ME,
    height: ME,
    overflow: "hidden",
    backgroundColor: colors.anon,
    alignItems: "center",
    justifyContent: "center",
  },
  chips: { position: "absolute", left: 0, right: 0, zIndex: 6 },
  recenterSpot: { position: "absolute", right: 14, bottom: 86, zIndex: 6 },
  recenter: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.surface,
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
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  // The design's game buttons set their label in 17px Bricolage
  listText: { color: colors.brand, ...font(800, 17) },
  action: {
    height: 52,
    paddingHorizontal: 20,
    borderRadius: 16,
    backgroundColor: colors.brand,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  actionText: { color: colors.surface, ...font(800, 17) },
});
