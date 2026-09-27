import { router } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { Avatar, AVATAR_SHAPES, GamePressable, Logo, Sticker } from "@/components/ui";
import { selectMe, useAppStore } from "@/store";
import { colors, divider, font } from "@/theme";

// Top bar of each tab's list view: logo + title, then your avatar (Messages is in the tab bar)
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
});
