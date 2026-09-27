import { useState } from "react";
import { StyleSheet, Text, TextInput, View, type TextInputProps } from "react-native";
import { colors, font } from "@/theme";
import FieldLabel from "./FieldLabel";

type Props = Omit<TextInputProps, "style"> & {
  label?: string;
  /** Fixed text shown inside the field before the value, e.g. "$" */
  prefix?: string;
  /** Fixed text after the value, e.g. "months" */
  suffix?: string;
  height?: number;
  /** Multiline only: visible lines before it scrolls */
  rows?: number;
};

// Bordered input from the design: 2px ink, radius 14, brand border on focus
export default function TextField({ label, prefix, suffix, height = 50, multiline, rows = 3, ...input }: Props) {
  const [focused, setFocused] = useState(false);
  const field = (
    <View>
      {prefix && (
        <View style={styles.prefixBox} pointerEvents="none">
          <Text style={styles.affix}>{prefix}</Text>
        </View>
      )}
      <TextInput
        placeholderTextColor={colors.faint}
        {...input}
        multiline={multiline}
        onFocus={(e) => {
          setFocused(true);
          input.onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          input.onBlur?.(e);
        }}
        style={[
          styles.input,
          multiline ? [styles.multiline, { minHeight: Math.round(rows * 14.5 * 1.45) + 24 }] : { height },
          prefix ? styles.withPrefix : null,
          suffix ? styles.withSuffix : null,
          focused && styles.focused,
        ]}
      />
      {suffix && (
        <View style={styles.suffixBox} pointerEvents="none">
          <Text style={styles.affix}>{suffix}</Text>
        </View>
      )}
    </View>
  );
  if (!label) return field;
  return (
    <View style={styles.group}>
      <FieldLabel>{label}</FieldLabel>
      {field}
    </View>
  );
}

const styles = StyleSheet.create({
  group: { gap: 8 },
  input: {
    borderWidth: 2,
    borderColor: colors.line,
    borderRadius: 14,
    paddingHorizontal: 16,
    backgroundColor: colors.surface,
    color: colors.ink,
    ...font(500, 15),
  },
  multiline: {
    paddingTop: 12,
    paddingBottom: 12,
    textAlignVertical: "top",
    ...font(500, 14.5, 1.45),
  },
  withPrefix: { paddingLeft: 30 },
  withSuffix: { paddingRight: 80 },
  suffixBox: { position: "absolute", right: 16, top: 0, bottom: 0, justifyContent: "center" },
  prefixBox: {
    position: "absolute",
    left: 16,
    top: 0,
    bottom: 0,
    zIndex: 1,
    justifyContent: "center",
  },
  affix: { color: colors.muted, ...font(700, 15) },
  focused: { borderColor: colors.brand },
});
