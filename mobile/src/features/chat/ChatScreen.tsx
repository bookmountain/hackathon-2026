import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Avatar, Icon, ScreenHeader } from "@/components/ui";
import type { ChatMessage } from "@/data/types";
import { findPerson, useAppStore } from "@/store";
import { colors, font } from "@/theme";

function Message({ message }: { message: ChatMessage }) {
  if (message.from === "system") {
    return (
      <View style={styles.context}>
        <Text style={styles.contextText}>{message.text}</Text>
      </View>
    );
  }
  const mine = message.from === "me";
  return (
    <View style={[styles.bubble, mine ? styles.mine : styles.theirs]}>
      <Text style={[styles.bubbleText, { color: mine ? colors.surface : colors.ink }]}>{message.text}</Text>
    </View>
  );
}

export default function ChatScreen() {
  const { personId } = useLocalSearchParams<{ personId: string }>();
  const { state, actions } = useAppStore();
  const [draft, setDraft] = useState("");
  const scroll = useRef<ScrollView>(null);
  const person = findPerson(personId);
  const thread = state.chats[personId] ?? [];
  const unread = !!state.unread[personId];
  const topic = state.chatTopics[personId] ?? "person";

  // Opening the thread marks it read
  useEffect(() => {
    if (unread) actions.openChat(personId, topic);
  }, [unread, personId, topic, actions]);

  if (!person) return null;

  const send = () => {
    if (!draft.trim()) return;
    actions.sendMessage(personId, draft);
    setDraft("");
  };

  return (
    <SafeAreaView edges={["top", "bottom"]} style={styles.screen}>
      <ScreenHeader onBack={() => router.back()} height={64}>
        <Avatar index={person.avatar} nick={person.nick} size={40} />
        <View style={styles.who}>
          <Text style={styles.nick}>{person.nick}</Text>
          <Text style={styles.meta}>
            {person.major} · {person.uni}
          </Text>
        </View>
      </ScreenHeader>

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView
          ref={scroll}
          style={styles.flex}
          contentContainerStyle={styles.messages}
          onContentSizeChange={() => scroll.current?.scrollToEnd({ animated: true })}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.privacy}>
            <Icon name="shield" size={12} color={colors.muted} strokeWidth={2.6} />
            <Text style={styles.privacyText}>Only nickname, major & uni are shared</Text>
          </View>
          {thread.map((m, i) => (
            <Message key={i} message={m} />
          ))}
          {state.typingWith === personId && (
            <View style={styles.typing}>
              <Text style={styles.typingText}>•••</Text>
            </View>
          )}
        </ScrollView>

        <View style={styles.composer}>
          <TextInput
            value={draft}
            onChangeText={setDraft}
            placeholder="Message…"
            placeholderTextColor={colors.faint}
            returnKeyType="send"
            onSubmitEditing={send}
            style={styles.input}
          />
          <Pressable onPress={send} accessibilityRole="button" accessibilityLabel="Send" style={styles.send}>
            <Icon name="arrowRight" color={colors.surface} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surface },
  flex: { flex: 1 },
  who: { flex: 1, minWidth: 0, gap: 1 },
  nick: { color: colors.ink, ...font(800, 15.5) },
  meta: { color: colors.muted, ...font(500, 12) },
  messages: { paddingHorizontal: 16, paddingVertical: 14, gap: 8, backgroundColor: colors.canvas, flexGrow: 1 },
  privacy: {
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.surface,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  privacyText: { color: colors.muted, ...font(600, 11.5) },
  context: {
    alignSelf: "center",
    marginVertical: 4,
    backgroundColor: colors.brandSofter,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  contextText: { color: colors.brandDeep, textAlign: "center", ...font(700, 11.5) },
  bubble: { maxWidth: "78%", paddingHorizontal: 14, paddingVertical: 10 },
  mine: {
    alignSelf: "flex-end",
    backgroundColor: colors.brand,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 6,
  },
  theirs: {
    alignSelf: "flex-start",
    backgroundColor: colors.surface,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderBottomLeftRadius: 6,
    borderBottomRightRadius: 18,
  },
  bubbleText: { ...font(500, 14.5, 1.45) },
  typing: {
    alignSelf: "flex-start",
    backgroundColor: colors.brandSoft,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  typingText: { color: colors.faint, ...font(700, 14, undefined, 0.2) },
  composer: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 10,
    borderTopWidth: 1,
    borderTopColor: colors.lineSoft,
    backgroundColor: colors.surface,
  },
  input: {
    flex: 1,
    height: 46,
    borderWidth: 1.5,
    borderColor: colors.line,
    borderRadius: 23,
    paddingHorizontal: 18,
    color: colors.ink,
    ...font(500, 15),
  },
  send: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.brand,
    alignItems: "center",
    justifyContent: "center",
  },
});
