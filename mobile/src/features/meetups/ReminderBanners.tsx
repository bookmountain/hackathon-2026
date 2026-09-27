import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Icon } from "@/components/ui";
import type { MeetupEvent } from "@/data/types";
import { colors, font } from "@/theme";
import { dueReminders } from "./reminders";
import { dismissReminder, useReminders } from "./useReminders";


const openEvent = (id: string) => router.push({ pathname: "/meetups/[id]", params: { id } });

// "Tomorrow · Stats cram" banners for events you set a reminder on
export default function ReminderBanners({ events }: { events: MeetupEvent[] }) {
  const { choices, dismissed } = useReminders();
  const due = dueReminders(events, choices, dismissed);
  if (!due.length) return null;
  return (
    <View style={styles.group}>
      {due.map(({ event, label, key }) => (
        <View key={key} style={styles.banner}>
          <View style={styles.bell}>
            <Icon name="bell" size={20} color={colors.ink} strokeWidth={2.2} />
          </View>
          <Pressable
            onPress={() => openEvent(event.id)}
            accessibilityRole="button"
            style={styles.text}
          >
            <Text style={styles.title} numberOfLines={2}>
              {label} · {event.title}
            </Text>
            <Text style={styles.sub}>{event.when} · you&apos;re going</Text>
          </Pressable>
          <Pressable
            onPress={() => dismissReminder(key)}
            accessibilityRole="button"
            accessibilityLabel="Dismiss reminder"
            hitSlop={8}
            style={styles.close}
          >
            <Icon name="close" size={16} color={colors.amberInk} />
          </Pressable>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  group: { gap: 10 },
  banner: {
    backgroundColor: colors.amberSoft,
    borderWidth: 2,
    borderColor: colors.yellow,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  bell: {
    width: 38,
    height: 38,
    borderRadius: 11,
    backgroundColor: colors.yellow,
    alignItems: "center",
    justifyContent: "center",
  },
  text: { flex: 1, minWidth: 0, gap: 1 },
  title: { color: colors.ink, ...font(800, 13.5) },
  sub: { color: colors.amberInk, ...font(600, 12) },
  close: { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center" },
});
