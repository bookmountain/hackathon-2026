import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Avatar, Icon, Logo } from "@/components/ui";
import { selectHasUnread, selectMe, useAppStore } from "@/store";
import { colors, divider, font } from "@/theme";

// Top bar of each tab's list view: logo + title, messages (yellow dot when unread), then your avatar
export default function AppHeader({ title }: { title: string }) {
  const { state } = useAppStore();
  const me = selectMe(state);

  return (
    <View style={styles.bar}>
      <View style={styles.brand}>
        <Logo size={30} />
        <Text style={styles.title}>{title}</Text>
      </View>
      <View style={styles.actions}>
        <Pressable
          onPress={() => router.push("/chats")}
          accessibilityRole="button"
          accessibilityLabel={selectHasUnread(state) ? "Messages, unread" : "Messages"}
          style={[styles.round, { backgroundColor: colors.brandSoft }]}
        >
          <Icon name="chat" color={colors.brand} />
          {selectHasUnread(state) && <View style={styles.unread} />}
        </Pressable>
        <Pressable
          onPress={() => router.push("/profile")}
          accessibilityRole="button"
          accessibilityLabel="Profile"
          style={styles.round}
        >
          <Avatar index={me.avatar} nick={me.nick} url={me.avatarUrl} look={me.avatarStyle} size={40} />
        </Pressable>
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
