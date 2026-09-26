import DateTimePicker, { DateTimePickerAndroid } from "@react-native-community/datetimepicker";
import { useState } from "react";
import { Modal, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { colors, font } from "@/theme";
import Button from "./Button";
import FieldLabel from "./FieldLabel";

type Props = {
  label: string;
  value: Date | null;
  onChange: (date: Date) => void;
  /** "date" for move-in / availability, "datetime" for events */
  mode?: "date" | "datetime";
  placeholder?: string;
};

function format(d: Date, mode: "date" | "datetime") {
  const date = d.toLocaleDateString("en-AU", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
  if (mode === "date") return date;
  return `${date} · ${d.toLocaleTimeString("en-AU", { hour: "numeric", minute: "2-digit" })}`;
}

// Field that opens the native date (and time) picker
export default function DateField({ label, value, onChange, mode = "date", placeholder = "Pick a date" }: Props) {
  const [iosOpen, setIosOpen] = useState(false);
  const [draft, setDraft] = useState<Date>(value ?? new Date());

  const open = () => {
    const start = value ?? new Date();
    if (Platform.OS === "android") {
      // Android has no combined picker: pick the date, then the time
      DateTimePickerAndroid.open({
        value: start,
        mode: "date",
        onValueChange: (_e, date) => {
          if (mode === "date") return onChange(date);
          DateTimePickerAndroid.open({ value: date, mode: "time", onValueChange: (_e2, time) => onChange(time) });
        },
      });
      return;
    }
    setDraft(start);
    setIosOpen(true);
  };

  return (
    <View style={styles.group}>
      <FieldLabel>{label}</FieldLabel>
      <Pressable onPress={open} accessibilityRole="button" style={styles.field}>
        <Text style={[styles.value, !value && { color: colors.faint }]}>
          {value ? format(value, mode) : placeholder}
        </Text>
      </Pressable>

      {Platform.OS === "ios" && (
        <Modal visible={iosOpen} transparent animationType="slide" onRequestClose={() => setIosOpen(false)}>
          <Pressable style={styles.backdrop} onPress={() => setIosOpen(false)} />
          <View style={styles.sheet}>
            <DateTimePicker
              value={draft}
              mode={mode}
              display={mode === "date" ? "inline" : "spinner"}
              accentColor={colors.brand}
              themeVariant="light"
              onValueChange={(_e, date) => setDraft(date)}
            />
            <Button
              label="Done"
              onPress={() => {
                onChange(draft);
                setIosOpen(false);
              }}
            />
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  group: { gap: 8 },
  field: {
    height: 50,
    borderWidth: 2,
    borderColor: colors.line,
    borderRadius: 14,
    paddingHorizontal: 14,
    justifyContent: "center",
    backgroundColor: colors.surface,
  },
  value: { color: colors.ink, ...font(600, 14) },
  backdrop: { flex: 1, backgroundColor: colors.scrim },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 36,
    gap: 12,
  },
});
