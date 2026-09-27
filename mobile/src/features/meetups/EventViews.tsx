import { router } from "expo-router";
import { Linking, Pressable, StyleSheet, Text, View } from "react-native";
import { errorMessage } from "@/api/client";
import { useToast } from "@/components/feedback/Toast";
import { AnonDots, Button, Icon } from "@/components/ui";
import type { MeetupEvent } from "@/data/types";
import { MapSheet } from "@/features/map";
import { googleCalendarUrl } from "@/lib/calendar";
import { brutal, colors, font, shadows } from "@/theme";
import { calendarEntry } from "./logic";
import { useJoin } from "./useJoin";

const openEvent = (id: string) => router.push({ pathname: "/meetups/[id]", params: { id } });

// Card over the map after tapping an event pin
export function EventSheet({ event }: { event: MeetupEvent }) {
  const { joined, going, label, busy, toggle } = useJoin(event);
  return (
    <MapSheet>
      <View style={styles.sheetText}>
        <Text style={styles.kicker}>{event.cat} · walk-in</Text>
        <Text style={styles.sheetTitle}>{event.title}</Text>
        <Text style={styles.meta}>
          {event.when} · {event.where.name}
        </Text>
      </View>
      <View style={styles.headcount}>
        <AnonDots count={going} />
        <Text style={styles.meta}>{going} going · host & guests hidden</Text>
      </View>
      <View style={styles.actions}>
        <Button
          label={label}
          size="md"
          variant={joined ? "soft" : "primary"}
          inactive={event.full && !joined}
          disabled={busy}
          onPress={toggle}
          style={[styles.grow, joined && brutal(3)]}
        />
        <Button label="Details" size="md" variant="outline" weight={700} onPress={() => openEvent(event.id)} />
      </View>
    </MapSheet>
  );
}

// Row in the Meetups list
export function EventCard({ event }: { event: MeetupEvent }) {
  const { joined, going, label, busy, toggle } = useJoin(event);
  const toast = useToast();
  const addToCalendar = () => Linking.openURL(googleCalendarUrl(calendarEntry(event))).catch((e) => toast(errorMessage(e)));
  return (
    <View style={styles.card}>
      <Pressable onPress={() => openEvent(event.id)} accessibilityRole="button" style={styles.cardTop}>
        <View style={styles.date}>
          <Text style={styles.day}>{event.day}</Text>
          <Text style={styles.dateNum}>{event.date}</Text>
        </View>
        <View style={styles.cardText}>
          <Text style={styles.cardKicker}>{event.cat}</Text>
          <Text style={styles.cardTitle}>{event.title}</Text>
          <Text style={styles.cardMeta}>
            {event.time} · {event.where.name}
          </Text>
        </View>
      </Pressable>
      <View style={styles.cardBottom}>
        <View style={styles.headcount}>
          <AnonDots count={going} />
          <Text style={styles.meta}>
            {going}/{event.cap}
          </Text>
        </View>
        <View style={styles.cardActions}>
          <Pressable
            onPress={addToCalendar}
            accessibilityRole="button"
            accessibilityLabel="Add to Google Calendar"
            style={({ pressed }) => [styles.calendar, pressed && { backgroundColor: colors.brandSoft }]}
          >
            <Icon name="calendarCheck" size={18} color={colors.brand} />
          </Pressable>
          <Button
            label={label}
            size="sm"
            variant={joined ? "soft" : "primary"}
            shadow={2}
            inactive={event.full && !joined}
            disabled={busy}
            onPress={toggle}
            style={joined && brutal(2)}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sheetText: { gap: 4 },
  kicker: { color: colors.brand, textTransform: "uppercase", ...font(700, 12, undefined, 0.06) },
  sheetTitle: { color: colors.ink, ...font(800, 19, 1.2) },
  meta: { color: colors.muted, ...font(600, 12.5) },
  headcount: { flexDirection: "row", alignItems: "center", gap: 8 },
  actions: { flexDirection: "row", gap: 8 },
  grow: { flex: 1 },
  card: { backgroundColor: colors.surface, borderRadius: 20, padding: 14, gap: 12, ...shadows.card },
  cardTop: { flexDirection: "row", alignItems: "center", gap: 14 },
  date: {
    width: 52,
    height: 56,
    borderRadius: 14,
    backgroundColor: colors.brandSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  day: { color: colors.brand, ...font(800, 11) },
  dateNum: { color: colors.brand, ...font(800, 20) },
  cardText: { flex: 1, minWidth: 0, gap: 3 },
  cardKicker: { color: colors.brand, textTransform: "uppercase", ...font(700, 11, undefined, 0.06) },
  cardTitle: { color: colors.ink, ...font(800, 15.5, 1.25) },
  cardMeta: { color: colors.muted, ...font(500, 12.5) },
  cardBottom: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 },
  cardActions: { flexDirection: "row", alignItems: "center", gap: 8 },
  calendar: {
    width: 38,
    height: 38,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.ink,
    alignItems: "center",
    justifyContent: "center",
  },
});
