import { StyleSheet, Text, View } from "react-native";
import { GamePressable, Icon } from "@/components/ui";
import { colors, font } from "@/theme";
import { REMINDER_OPTIONS } from "./reminders";
import { toggleEventReminder, useEventReminders } from "./useReminders";


type Props = {
  eventId: string;
  /** "inline" = "Remind me" beside the pills (list cards); "stacked" = heading above (detail page) */
  layout: "inline" | "stacked";
};

// "2 days before" / "1 day before" toggles for an event you're going to
export default function ReminderPills({ eventId, layout }: Props) {
  const chosen = useEventReminders(eventId);
  const inline = layout === "inline";
  return (
    <View style={inline ? styles.inline : styles.stacked}>
      <Text style={inline ? styles.inlineLabel : styles.stackedLabel}>{inline ? "Remind me" : "Remind me in the app"}</Text>
      <View style={[styles.pills, !inline && styles.wrap]}>
        {REMINDER_OPTIONS.map((o) => {
          const on = chosen.includes(o.key);
          const fg = on ? colors.surface : colors.body;
          return (
            <GamePressable
              kind="sm"
              key={o.key}
              onPress={() => toggleEventReminder(eventId, o.key)}
              accessibilityRole="switch"
              accessibilityState={{ checked: on }}
              accessibilityLabel={`Remind me ${o.label}`}
              faceStyle={[styles.pill, inline ? styles.pillTight : styles.pillWide, on ? styles.on : styles.off]}
            >
              <Icon name="bell" size={13} color={fg} />
              <Text style={[styles.pillText, { color: fg }]}>{o.label}</Text>
            </GamePressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  inline: { flexDirection: "row", alignItems: "center", gap: 6 },
  stacked: { gap: 8 },
  inlineLabel: { color: colors.muted, ...font(700, 12) },
  stackedLabel: { color: colors.muted, ...font(700, 13) },
  pills: { flexDirection: "row", gap: 6 },
  wrap: { flexWrap: "wrap", gap: 8 },
  // Game "sm" face: 2.5px ink border and a 3px ledge, whatever the state
  pill: { height: 32, borderRadius: 999, flexDirection: "row", alignItems: "center", gap: 5 },
  pillTight: { paddingHorizontal: 9 },
  pillWide: { paddingHorizontal: 12 },
  on: { backgroundColor: colors.brand },
  off: { backgroundColor: colors.surface },
  pillText: { ...font(700, 12.5) },
});
