import { router } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { Avatar, AVATAR_SHAPES, GamePressable, Icon, Logo, Sticker } from "@/components/ui";
import { selectHasUnread, selectMe, useAppStore } from "@/store";
import { colors, divider, font } from "@/theme";

// Top bar of each tab's list view: logo + title, messages (yellow dot when unread), then your avatar
export default function AppHeader({ title }: { title: string }) {
  const { state } = useAppStore();
  const me = selectMe(state);
  const shape = me.avatarStyle?.shape ?? "Circle";

  return (
    <View style={styles.bar}>
      <View style={styles.brand}>
        <Logo size={30} />
        <Text style={styles.title}>{title}</Text>
        <Sticker name="roo" size={30} rotate={10} />
      </View>
      <View style={styles.actions}>
        <GamePressable
          kind="round"
          onPress={() => router.push("/chats")}
          accessibilityRole="button"
          accessibilityLabel={selectHasUnread(state) ? "Messages, unread" : "Messages"}
          faceStyle={[styles.round, { backgroundColor: colors.brandSoft }]}
        >
          <Icon name="chat" color={colors.brand} />
          {selectHasUnread(state) && <View style={styles.unread} />}
        </GamePressable>
        <GamePressable
          // Round button when the avatar is a circle, a small game button otherwise
          kind={shape === "Circle" ? "round" : "sm"}
          onPress={() => router.push("/profile")}
          accessibilityRole="button"
          accessibilityLabel="Profile"
          faceStyle={[styles.round, styles.me, { borderRadius: 40 * AVATAR_SHAPES[shape] }]}
        >
          <Avatar index={me.avatar} nick={me.nick} url={me.avatarUrl} look={me.avatarStyle} size={35} />
        </GamePressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    backgroundColor: colors.surface,
    ...divider.bottom,
  },
  brand: { flexDirection: "row", alignItems: "center", gap: 9 },
  title: { color: colors.ink, ...font(800, 20, undefined, -0.02) },
  actions: { flexDirection: "row", gap: 10, alignItems: "center" },
  round: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  me: { overflow: "hidden", backgroundColor: colors.anon },
  unread: {
    position: "absolute",
    top: 7,
    right: 8,
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: colors.yellow,
    borderWidth: 2,
    borderColor: colors.surface,
  },
});
