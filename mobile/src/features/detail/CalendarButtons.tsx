import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import { Linking, Pressable, StyleSheet, Text, View } from "react-native";
import { useToast } from "@/components/feedback/Toast";
import { FieldLabel, Icon } from "@/components/ui";
import { googleCalendarUrl, icsFile, icsFileName, type CalendarEvent } from "@/lib/calendar";
import { colors, font } from "@/theme";

/** Writes the event as an .ics file and hands it to the share sheet (opens in Apple Calendar) */
async function openIcs(event: CalendarEvent) {
  const file = new File(Paths.cache, icsFileName(event.title));
  file.create({ overwrite: true });
  file.write(icsFile(event));
  await Sharing.shareAsync(file.uri, { mimeType: "text/calendar", UTI: "com.apple.ical.ics", dialogTitle: event.title });
}

// "Add to calendar": Google Calendar link and Apple Calendar (.ics) side by side
export default function CalendarButtons({ label, event }: { label: string; event: CalendarEvent }) {
  const toast = useToast();

  const google = () => Linking.openURL(googleCalendarUrl(event)).catch(() => toast("Couldn't open Google Calendar"));
  const apple = async () => {
    try {
      if (!(await Sharing.isAvailableAsync())) return toast("Calendar files can't be opened on this device");
      await openIcs(event);
    } catch {
      toast("Couldn't create the calendar file");
    }
  };

  return (
    <View style={styles.group}>
      <FieldLabel>{label}</FieldLabel>
      <View style={styles.row}>
        <Pressable
          onPress={google}
          accessibilityRole="button"
          style={({ pressed }) => [styles.button, pressed && { borderColor: colors.brand, backgroundColor: colors.brandSoft }]}
        >
          <Icon name="calendarCheck" size={18} color={colors.brand} />
          <Text style={styles.text}>Google Calendar</Text>
        </Pressable>
        <Pressable
          onPress={apple}
          accessibilityRole="button"
          style={({ pressed }) => [styles.button, pressed && { backgroundColor: colors.canvas }]}
        >
          <Icon name="calendarCheck" size={18} color={colors.appleRed} />
          <Text style={styles.text}>Apple Calendar</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  group: { gap: 8 },
  row: { flexDirection: "row", gap: 8 },
  button: {
    flex: 1,
    height: 46,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: colors.ink,
    backgroundColor: colors.surface,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  text: { color: colors.ink, ...font(700, 13.5) },
});
