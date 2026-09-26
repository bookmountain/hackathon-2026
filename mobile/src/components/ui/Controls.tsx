import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, font } from "@/theme";
import Icon from "./Icon";

// Small form controls from the design: checkbox, switch and −/+ stepper

export function Checkbox({ checked, onPress, label, note }: {
  checked: boolean;
  onPress: () => void;
  label: string;
  note?: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      style={styles.checkRow}
    >
      <View
        style={[
          styles.box,
          { borderColor: checked ? colors.brand : colors.checkbox, backgroundColor: checked ? colors.brand : colors.surface },
        ]}
      >
        {checked && <Icon name="check" size={14} color={colors.surface} />}
      </View>
      <Text style={styles.checkLabel}>
        {label} {note ? <Text style={{ color: colors.muted }}>{note}</Text> : null}
      </Text>
    </Pressable>
  );
}

export function Switch({ on }: { on: boolean }) {
  return (
    <View style={[styles.track, { backgroundColor: on ? colors.brand : colors.ink }]}>
      <View style={[styles.knob, { left: on ? 21 : 3 }]} />
    </View>
  );
}

export function Stepper({ value, onMinus, onPlus }: { value: number; onMinus: () => void; onPlus: () => void }) {
  return (
    <View style={styles.stepper}>
      <Pressable onPress={onMinus} accessibilityLabel="Decrease" style={styles.stepBtn}>
        <Text style={styles.stepSign}>−</Text>
      </Pressable>
      <Text style={styles.stepValue}>{value}</Text>
      <Pressable onPress={onPlus} accessibilityLabel="Increase" style={styles.stepBtn}>
        <Text style={styles.stepSign}>+</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  checkRow: { flexDirection: "row", gap: 12, alignItems: "flex-start" },
  box: {
    width: 24,
    height: 24,
    borderRadius: 7,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  checkLabel: { flex: 1, color: colors.ink, ...font(500, 14, 1.45) },
  track: { width: 44, height: 26, borderRadius: 13 },
  knob: {
    position: "absolute",
    top: 3,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.surface,
  },
  stepper: {
    height: 50,
    borderWidth: 2,
    borderColor: colors.line,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 6,
  },
  stepBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: colors.brandSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  stepSign: { color: colors.brand, ...font(800, 18) },
  stepValue: { color: colors.ink, ...font(800, 16) },
});
