import { Pressable, StyleSheet, Text } from "react-native";
import { Icon } from "@/components/ui";
import type { MeetupEvent } from "@/data/types";
import { colors, font } from "@/theme";
import { useJoin } from "./useJoin";

// Yellow headcount tag; dark outline while its card is open
export default function EventPin({ event, selected, onPress }: { event: MeetupEvent; selected: boolean; onPress: () => void }) {
  const { going } = useJoin(event);
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${event.title}, ${going} going`}
      style={[styles.pin, { borderColor: selected ? colors.ink : colors.surface }]}
    >
      <Icon name="people" size={13} color={colors.ink} />
      <Text style={styles.count}>{going}</Text>
    </Pressable>
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
