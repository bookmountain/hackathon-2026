import { StyleSheet, Text, View } from "react-native";
import { Icon } from "@/components/ui";
import type { MeetupEvent } from "@/data/types";
import { colors, font } from "@/theme";

// Yellow headcount tag; dark outline while its card is open
export default function EventPin({ event, selected }: { event: MeetupEvent; selected: boolean }) {
  return (
    <View style={[styles.pin, { borderColor: selected ? colors.ink : colors.surface }]}>
      <Icon name="people" size={13} color={colors.ink} />
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
    backgroundColor: colors.yellow,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    shadowColor: colors.ink,
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  count: { color: colors.ink, ...font(800, 12) },
});
