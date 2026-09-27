import DateTimePicker, { DateTimePickerAndroid } from "@react-native-community/datetimepicker";
import { useState } from "react";
import { Modal, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { formatAuDate, parseAuDate } from "@/lib/auDate";
import { colors, font } from "@/theme";
import Button from "./Button";
import FieldLabel from "./FieldLabel";
import Icon from "./Icon";

type DateProps = {
  label?: string;
  /** "DD/MM/YYYY", or "" for none */
  value: string;
  onChange: (text: string) => void;
  placeholder?: string;
  /** Shown under the field */
  error?: string | null;
  /** Earliest pickable day; defaults to today (every date the app asks for is today or later) */
  minimumDate?: Date;
};

const startOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

// A date from the system picker: a calendar sheet on iOS, the date dialog on Android
export default function DateField({ label, value, onChange, placeholder = "Pick a date", error, minimumDate }: DateProps) {
  const [iosOpen, setIosOpen] = useState(false);
  const min = minimumDate ?? startOfToday();
  const current = parseAuDate(value);
  const [draft, setDraft] = useState<Date>(current ?? min);

  const open = () => {
    const start = current && current >= min ? current : min;
    if (Platform.OS === "android") {
      DateTimePickerAndroid.open({
        value: start,
        mode: "date",
        minimumDate: min,
        onValueChange: (_e, d) => onChange(formatAuDate(d)),
      });
      return;
    }
    setDraft(start);
    setIosOpen(true);
  };

  return (
    <View style={styles.group}>
      {label ? <FieldLabel>{label}</FieldLabel> : null}
      <Pressable
        onPress={open}
        accessibilityRole="button"
        accessibilityLabel={label ?? "Date"}
        accessibilityValue={{ text: value || placeholder }}
        style={[styles.field, styles.pressable, !!error && { borderColor: colors.danger }]}
      >
        <Text style={[styles.value, !value && { color: colors.faint }]}>{value || placeholder}</Text>
        <View pointerEvents="none" style={styles.icon}>
          <Icon name="calendar" size={18} color={colors.brand} />
        </View>
      </Pressable>
      {error ? <Text style={styles.error}>{error}</Text> : null}

      {Platform.OS === "ios" && (
        <Modal visible={iosOpen} transparent animationType="slide" onRequestClose={() => setIosOpen(false)}>
          <Pressable style={styles.backdrop} onPress={() => setIosOpen(false)} />
          <View style={styles.sheet}>
            <DateTimePicker
              value={draft}
              mode="date"
              display="inline"
              minimumDate={min}
              accentColor={colors.brand}
              themeVariant="light"
              onValueChange={(_e, d) => setDraft(d)}
            />
            <Button
              label="Done"
              onPress={() => {
                onChange(formatAuDate(draft));
                setIosOpen(false);
              }}
            />
            {!!value && (
              <Button
                label="Clear date"
                variant="outline"
                size="md"
                onPress={() => {
                  onChange("");
                  setIosOpen(false);
                }}
              />
            )}
          </View>
        </Modal>
      )}
    </View>
  );
}

type TimeProps = {
  label?: string;
  /** "HH:MM" (24-hour), or "" for not picked */
  value: string;
  onChange: (time: string) => void;
  placeholder?: string;
};

const pad = (n: number) => String(n).padStart(2, "0");
const toHHMM = (d: Date) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;

function fromHHMM(time: string): Date {
  const [h, m] = (time || "18:00").split(":").map(Number);
  const d = new Date();
  d.setHours(h || 0, m || 0, 0, 0);
  return d;
}

function display(time: string) {
  return fromHHMM(time).toLocaleTimeString("en-AU", { hour: "numeric", minute: "2-digit" });
}

// Field that opens the native time picker
export function TimeField({ label, value, onChange, placeholder = "18:00" }: TimeProps) {
  const [iosOpen, setIosOpen] = useState(false);
  const [draft, setDraft] = useState<Date>(fromHHMM(value));

  const open = () => {
    if (Platform.OS === "android") {
      DateTimePickerAndroid.open({ value: fromHHMM(value), mode: "time", onValueChange: (_e, d) => onChange(toHHMM(d)) });
      return;
    }
    setDraft(fromHHMM(value));
    setIosOpen(true);
  };

  return (
    <View style={styles.group}>
      {label ? <FieldLabel>{label}</FieldLabel> : null}
      <Pressable onPress={open} accessibilityRole="button" accessibilityLabel={label ?? "Time"} style={[styles.field, styles.pressable]}>
        <Text style={[styles.value, !value && { color: colors.faint }]}>{value ? display(value) : placeholder}</Text>
        <View pointerEvents="none" style={styles.icon}>
          <Icon name="clock" size={18} color={colors.brand} />
        </View>
      </Pressable>

      {Platform.OS === "ios" && (
        <Modal visible={iosOpen} transparent animationType="slide" onRequestClose={() => setIosOpen(false)}>
          <Pressable style={styles.backdrop} onPress={() => setIosOpen(false)} />
          <View style={styles.sheet}>
            <DateTimePicker
              value={draft}
              mode="time"
              display="spinner"
              accentColor={colors.brand}
              themeVariant="light"
              onValueChange={(_e, d) => setDraft(d)}
            />
            <Button
              label="Done"
              onPress={() => {
                onChange(toHHMM(draft));
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
    backgroundColor: colors.surface,
  },
  icon: { position: "absolute", right: 14, top: 0, bottom: 0, justifyContent: "center" },
  pressable: { paddingHorizontal: 16, justifyContent: "center" },
  value: { color: colors.ink, ...font(600, 15) },
  error: { color: colors.danger, ...font(600, 12.5) },
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
