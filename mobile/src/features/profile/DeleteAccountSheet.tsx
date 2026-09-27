import { useState } from "react";
import { KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Icon } from "@/components/ui";
import { colors, font } from "@/theme";
import { CONFIRM_WORD, deleteConfirmed } from "./deleteAccount";

const WHAT_GOES = [
  "Your nickname, avatar and interests",
  "All your room and item listings",
  "Your chats and meetup RSVPs",
  "Approximate location history",
];

// Design colours with no theme token
const SCRIM = "rgba(20,20,43,0.55)";
const DANGER_SOFT = "#FFF5F5";
const DANGER_INACTIVE = "#E8B4B9";
const GREY_BOX = "#F5F6FA";

type Props = {
  visible: boolean;
  busy: boolean;
  onDelete: () => void;
  onClose: () => void;
};

// "Delete your account?" bottom sheet: lists what's erased and asks you to type DELETE
export default function DeleteAccountSheet({ visible, busy, onDelete, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const [text, setText] = useState("");
  const [focused, setFocused] = useState(false);
  const ready = deleteConfirmed(text);

  const close = () => {
    setText("");
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={close}>
      <KeyboardAvoidingView style={styles.scrim} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <Pressable style={styles.flex} onPress={close} accessibilityLabel="Keep my account" />
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 12) + 22 }]}>
          <View style={styles.badge}>
            <Icon name="trash" size={24} color={colors.danger} />
          </View>
          <Text style={styles.title}>Delete your account?</Text>
          <View style={styles.list}>
            {WHAT_GOES.map((line) => (
              <Text key={line} style={styles.listItem}>
                • {line}
              </Text>
            ))}
          </View>
          <Text style={styles.note}>
            This can&apos;t be undone. Your data is erased within 30 days, in line with the Australian Privacy Principles.
          </Text>
          <View style={styles.field}>
            <Text style={styles.label}>Type DELETE to confirm</Text>
            <TextInput
              value={text}
              onChangeText={setText}
              placeholder={CONFIRM_WORD}
              placeholderTextColor={colors.faint}
              autoCapitalize="characters"
              autoCorrect={false}
              autoComplete="off"
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              style={[styles.input, focused && styles.inputFocused]}
            />
          </View>
          <Pressable
            onPress={() => ready && !busy && onDelete()}
            accessibilityRole="button"
            accessibilityState={{ disabled: !ready || busy }}
            style={[styles.delete, { backgroundColor: ready ? colors.danger : DANGER_INACTIVE }]}
          >
            <Text style={styles.deleteText}>{busy ? "Deleting…" : "Delete permanently"}</Text>
          </Pressable>
          <Pressable onPress={close} accessibilityRole="button" style={styles.keep}>
            <Text style={styles.keepText}>Keep my account</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: { flex: 1, backgroundColor: SCRIM },
  flex: { flex: 1 },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    paddingTop: 22,
    paddingHorizontal: 20,
    gap: 14,
  },
  badge: {
    alignSelf: "center",
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: DANGER_SOFT,
    alignItems: "center",
    justifyContent: "center",
  },
  title: { color: colors.ink, textAlign: "center", ...font(800, 21) },
  list: { gap: 7, backgroundColor: GREY_BOX, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12 },
  listItem: { color: colors.body, ...font(500, 13, 1.45) },
  note: { color: colors.muted, textAlign: "center", ...font(500, 12.5, 1.45) },
  field: { gap: 6 },
  label: { color: colors.muted, ...font(700, 12.5) },
  input: {
    height: 48,
    borderWidth: 1.5,
    borderColor: colors.lineLight,
    borderRadius: 12,
    paddingHorizontal: 14,
    color: colors.ink,
    ...font(700, 15, undefined, 0.08),
  },
  inputFocused: { borderColor: colors.danger },
  delete: { height: 52, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  deleteText: { color: colors.surface, ...font(800, 16) },
  keep: { height: 46, alignItems: "center", justifyContent: "center" },
  keepText: { color: colors.ink, ...font(700, 14.5) },
});
