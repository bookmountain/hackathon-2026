import { router } from "expo-router";
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRefreshOnFocus } from "@/api/hooks";
import EmptyState from "@/components/feedback/EmptyState";
import { Avatar, ScreenHeader } from "@/components/ui";
import { useAppStore } from "@/store";
import { colors, font } from "@/theme";
import { goBack } from "@/lib/goBack";

export default function ChatsScreen() {
  const { state, actions } = useAppStore();
  const { refreshing, refresh } = useRefreshOnFocus(actions.loadChats);

  return (
    <SafeAreaView edges={["top"]} style={styles.screen}>
      <ScreenHeader title="Messages" onBack={() => goBack()} />
      <FlatList
        data={state.chats}
        keyExtractor={(c) => c.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.brand} />}
        ListEmptyComponent={
          <EmptyState sticker="koala" title="No chats yet, mate!" text="Tap a listing on the map and send a message." />
        }
        renderItem={({ item: { id, person, preview, unread } }) => (
          <Pressable
            onPress={() => router.push({ pathname: "/chats/[id]", params: { id } })}
            style={({ pressed }) => [styles.row, pressed && { backgroundColor: colors.canvas }]}
          >
            <Avatar index={person.avatar} nick={person.nick} url={person.avatarUrl} look={person.avatarStyle} size={50} />
            <View style={styles.text}>
              <View style={styles.topLine}>
                <Text style={styles.nick}>{person.nick}</Text>
                <Text style={styles.uni}>{person.uni}</Text>
              </View>
              <Text
                numberOfLines={1}
                // Unread is the design's DM Sans 800; 700 is the heaviest DM Sans we load (800 would be Bricolage)
                style={[font(unread ? 700 : 500, 13.5), { color: unread ? colors.ink : colors.muted }]}
              >
                {preview}
              </Text>
            </View>
          </Pressable>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surface },
  list: { paddingHorizontal: 10, paddingVertical: 8 },
  row: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 10, paddingVertical: 12, borderRadius: 16 },
  text: { flex: 1, minWidth: 0, gap: 3 },
  topLine: { flexDirection: "row", justifyContent: "space-between" },
  nick: { color: colors.ink, ...font(800, 15) },
  uni: { color: colors.faint, ...font(600, 11.5) },
});
