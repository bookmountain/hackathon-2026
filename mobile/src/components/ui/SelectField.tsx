import { useState } from "react";
import { FlatList, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, font } from "@/theme";
import FieldLabel from "./FieldLabel";
import Icon from "./Icon";

type Props = {
  label: string;
  value: string;
  options: readonly string[];
  onChange: (value: string) => void;
  placeholder?: string;
};

// Replaces the design's <select>: a field that opens a bottom sheet of options
export default function SelectField({ label, value, options, onChange, placeholder = "Select" }: Props) {
  const [open, setOpen] = useState(false);
  const insets = useSafeAreaInsets();
  return (
    <View style={styles.group}>
      <FieldLabel>{label}</FieldLabel>
      <Pressable onPress={() => setOpen(true)} accessibilityRole="button" style={styles.field}>
        <Text style={[styles.value, !value && { color: colors.faint }]}>{value || placeholder}</Text>
        <Icon name="chevronDown" size={18} color={colors.muted} />
      </Pressable>

      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)} />
        <View style={[styles.sheet, { paddingBottom: insets.bottom + 12 }]}>
          <Text style={styles.sheetTitle}>{label}</Text>
          <FlatList
            data={options}
            keyExtractor={(o) => o}
            renderItem={({ item }) => {
              const selected = item === value;
              return (
                <Pressable
                  onPress={() => {
                    onChange(item);
                    setOpen(false);
                  }}
                  style={[styles.option, selected && styles.optionSelected]}
                >
                  <Text style={[styles.optionText, selected && { color: colors.brand }]}>{item}</Text>
                  {selected && <Icon name="check" size={16} color={colors.brand} />}
                </Pressable>
              );
            }}
          />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  group: { gap: 8 },
  field: {
    height: 52,
    borderWidth: 1.5,
    borderColor: colors.line,
    borderRadius: 14,
    paddingLeft: 16,
    paddingRight: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.surface,
  },
  value: { color: colors.ink, ...font(600, 15) },
  backdrop: { flex: 1, backgroundColor: "rgba(10,26,63,0.3)" },
  sheet: {
    maxHeight: "60%",
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 18,
    paddingHorizontal: 12,
  },
  sheetTitle: { color: colors.ink, paddingHorizontal: 8, paddingBottom: 8, ...font(800, 17) },
  option: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 14,
    borderRadius: 12,
  },
  optionSelected: { backgroundColor: colors.brandSoft },
  optionText: { color: colors.ink, ...font(600, 15) },
});
