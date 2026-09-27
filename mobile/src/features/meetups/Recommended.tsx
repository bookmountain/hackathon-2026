import { router } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { GamePressable } from "@/components/ui";
import type { MeetupEvent } from "@/data/types";
import { isPersonalised } from "@/features/persona/logic";
import { recommendEvents } from "@/features/persona/recommend";
import { usePersona } from "@/features/persona/usePersona";
import { selectMe, useAppStore } from "@/store";
import { colors, font } from "@/theme";


const openEvent = (id: string) => router.push({ pathname: "/meetups/[id]", params: { id } });
const editPersona = () => router.push("/persona");

// "Recommended for you" cards, or a prompt to personalise when there's no persona yet
export default function Recommended({ events }: { events: MeetupEvent[] }) {
  const { state } = useAppStore();
  const { persona, loaded } = usePersona();
  if (!loaded) return null;
  const picks = recommendEvents(events, persona, selectMe(state).major);

  return (
    <>
      {picks.length > 0 && (
        <View style={styles.section}>
          <View style={styles.head}>
            <Text style={styles.title}>Recommended for you</Text>
            <Pressable onPress={editPersona} accessibilityRole="button" hitSlop={8}>
              <Text style={styles.link}>Edit interests</Text>
            </Pressable>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.bleed} contentContainerStyle={styles.row}>
            {picks.map(({ event, reason }) => (
              <GamePressable
                kind="row"
                key={event.id}
                onPress={() => openEvent(event.id)}
                accessibilityRole="button"
                faceStyle={styles.card}
              >
                <Text style={styles.cat}>{event.cat}</Text>
                <Text style={styles.cardTitle}>{event.title}</Text>
                <Text style={styles.when}>{event.when}</Text>
                <Text style={styles.reason}>{reason}</Text>
              </GamePressable>
            ))}
          </ScrollView>
        </View>
      )}
      {!isPersonalised(persona) && (
        <View style={styles.prompt}>
          <View style={styles.promptText}>
            <Text style={styles.promptTitle}>Get meetups picked for you</Text>
            <Text style={styles.promptSub}>Tell us your interests and goals.</Text>
          </View>
          <GamePressable
            kind="sm"
            onPress={editPersona}
            accessibilityRole="button"
            faceStyle={(pressed) => [styles.personalise, pressed && { backgroundColor: colors.brandPressed }]}
          >
            <Text style={styles.personaliseText}>Personalise</Text>
          </GamePressable>
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  section: { gap: 10 },
  head: { flexDirection: "row", justifyContent: "space-between", alignItems: "baseline", gap: 10 },
  title: { color: colors.ink, ...font(800, 15) },
  link: { color: colors.brand, ...font(700, 12.5) },
  // Scrolls edge to edge past the list's 18px padding
  bleed: { marginHorizontal: -18 },
  row: { paddingHorizontal: 18, paddingBottom: 4, gap: 10 },
  card: { width: 180, backgroundColor: colors.blueTint, borderRadius: 16, padding: 14, gap: 6 },
  cat: { color: colors.brand, textTransform: "uppercase", ...font(700, 11, undefined, 0.05) },
  cardTitle: { color: colors.ink, ...font(800, 14, 1.2) },
  when: { color: colors.muted, ...font(600, 12) },
  reason: {
    alignSelf: "flex-start",
    color: colors.amberInk,
    backgroundColor: colors.amberSoft,
    borderRadius: 999,
    overflow: "hidden",
    paddingHorizontal: 8,
    paddingVertical: 4,
    ...font(700, 11),
  },
  prompt: { backgroundColor: colors.blueTint, borderRadius: 16, padding: 14, flexDirection: "row", alignItems: "center", gap: 12 },
  promptText: { flex: 1, gap: 2 },
  promptTitle: { color: colors.ink, ...font(800, 14) },
  promptSub: { color: colors.muted, ...font(500, 12.5, 1.4) },
  personalise: { height: 38, paddingHorizontal: 14, borderRadius: 11, backgroundColor: colors.brand, justifyContent: "center" },
  personaliseText: { color: colors.surface, ...font(700, 13) },
});
