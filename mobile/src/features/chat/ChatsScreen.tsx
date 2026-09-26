import { router } from "expo-router";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Avatar, ScreenHeader } from "@/components/ui";
import { findPerson, useAppStore } from "@/store";
import { colors, font } from "@/theme";
import { threadPreview } from "./threadPreview";

export default function ChatsScreen() {
  const { state } = useAppStore();
  const threads = Object.keys(state.chats).flatMap((id) => {
    const person = findPerson(id);
    return person ? [{ person, preview: threadPreview(state.chats[id]), unread: !!state.unread[id] }] : [];
  });

  return (
    <SafeAreaView edges={["top"]} style={styles.screen}>
      <ScreenHeader title="Messages" onBack={() => router.back()} />
      <FlatList
        data={threads}
        keyExtractor={(t) => t.person.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={styles.empty}>No chats yet. Tap a listing on the map and send a message.</Text>
        }
        renderItem={({ item: { person, preview, unread } }) => (
          <Pressable
            onPress={() => router.push({ pathname: "/chats/[personId]", params: { personId: person.id } })}
            style={({ pressed }) => [styles.row, pressed && { backgroundColor: colors.canvas }]}
          >
            <Avatar index={person.avatar} nick={person.nick} size={50} />
            <View style={styles.text}>
              <View style={styles.topLine}>
                <Text style={styles.nick}>{person.nick}</Text>
                <Text style={styles.uni}>{person.uni}</Text>
              </View>
              <Text
                numberOfLines={1}
                style={[font(unread ? 800 : 500, 13.5), { color: unread ? colors.ink : colors.muted }]}
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
  empty: { paddingHorizontal: 20, paddingVertical: 40, textAlign: "center", color: colors.muted, ...font(600, 14, 1.5) },
});
