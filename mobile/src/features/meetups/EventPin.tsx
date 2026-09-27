import { StyleSheet, Text, View } from "react-native";
import { Icon } from "@/components/ui";
import type { MeetupEvent } from "@/data/types";
import { colors, font } from "@/theme";

// Coral headcount tag; ink while its card is open
export default function EventPin({ event, selected }: { event: MeetupEvent; selected: boolean }) {
  return (
    <View style={[styles.pin, { backgroundColor: selected ? colors.ink : colors.coral }]}>
      <Icon name="people" size={13} color={colors.surface} />
      <Text style={styles.count}>{event.going}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pin: {
    height: 28,
    paddingHorizontal: 9,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: colors.surface,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    boxShadow: "0 6px 14px rgba(20,20,43,0.35)",
  },
  count: { color: colors.surface, ...font(800, 12) },
});
