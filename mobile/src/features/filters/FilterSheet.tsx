import type { ReactNode } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button, Icon, Switch } from "@/components/ui";
import { colors, divider, font } from "@/theme";

type Props = {
  visible: boolean;
  onClose: () => void;
  /** Resets the draft; the dialog stays open */
  onClear: () => void;
  /** Applies the draft and closes */
  onApply: () => void;
  /** "Show 12 rooms" */
  applyLabel: string;
  children: ReactNode;
};

// Bottom sheet with a tab's filter options, "Clear all" and "Show N …"
export default function FilterSheet({ visible, onClose, onClear, onApply, applyLabel, children }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Close filters" />
      <View style={[styles.sheet, { paddingBottom: insets.bottom + 12 }]}>
        <View style={styles.header}>
          <Text style={styles.title}>Filters</Text>
          <Pressable onPress={onClose} hitSlop={8} accessibilityRole="button" accessibilityLabel="Close" style={styles.close}>
            <Icon name="close" size={18} color={colors.ink} />
          </Pressable>
        </View>
        <ScrollView contentContainerStyle={styles.body}>{children}</ScrollView>
        <View style={styles.footer}>
          <Button label="Clear all" variant="outline" size="md" weight={700} onPress={onClear} />
          <Button label={applyLabel} size="md" onPress={onApply} style={styles.apply} />
        </View>
      </View>
    </Modal>
  );
}

/** A titled group of options inside the sheet */
export function FilterSection({ title, value, children }: { title: string; value?: string; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHead}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {value ? <Text style={styles.sectionValue}>{value}</Text> : null}
      </View>
      {children}
    </View>
  );
}

/** On/off row, e.g. "Fully furnished" */
export function FilterToggle({ label, note, value, onChange }: { label: string; note?: string; value: boolean; onChange: (on: boolean) => void }) {
  return (
    <Pressable onPress={() => onChange(!value)} accessibilityRole="switch" accessibilityState={{ checked: value }} style={styles.toggle}>
      <View style={styles.toggleText}>
        <Text style={styles.toggleLabel}>{label}</Text>
        {note ? <Text style={styles.toggleNote}>{note}</Text> : null}
      </View>
      <Switch on={value} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: colors.scrim },
  sheet: {
    maxHeight: "85%",
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 2,
    borderBottomWidth: 0,
    borderColor: colors.ink,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 12,
  },
  title: { color: colors.ink, ...font(800, 22, undefined, -0.02) },
  close: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.brandSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  body: { paddingHorizontal: 20, paddingBottom: 20, gap: 24 },
  section: { gap: 12 },
  sectionHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "baseline" },
  sectionTitle: { color: colors.ink, ...font(800, 16) },
  sectionValue: { color: colors.brand, ...font(700, 14) },
  toggle: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  toggleText: { flex: 1, gap: 2 },
  toggleLabel: { color: colors.ink, ...font(600, 15) },
  toggleNote: { color: colors.muted, ...font(500, 12.5) },
  footer: { ...divider.top, flexDirection: "row", gap: 10, paddingHorizontal: 20, paddingTop: 14 },
  apply: { flex: 1 },
});
