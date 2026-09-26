import { useState } from "react";
import { StyleSheet, Text, TextInput, View, type TextInputProps } from "react-native";
import { colors, font } from "@/theme";
import FieldLabel from "./FieldLabel";

type Props = Omit<TextInputProps, "style"> & {
  label?: string;
  /** Fixed text shown inside the field before the value, e.g. "$" */
  prefix?: string;
  height?: number;
};

// Bordered input from the design: 2px ink, radius 14, brand border on focus
export default function TextField({ label, prefix, height = 50, multiline, ...input }: Props) {
  const [focused, setFocused] = useState(false);
  const field = (
    <View>
      {prefix && (
        <View style={styles.prefixBox} pointerEvents="none">
          <Text style={styles.prefix}>{prefix}</Text>
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
          multiline ? styles.multiline : { height },
          prefix ? styles.withPrefix : null,
          focused && styles.focused,
        ]}
      />
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
    minHeight: 92,
    paddingTop: 12,
    paddingBottom: 12,
    textAlignVertical: "top",
    ...font(500, 14.5, 1.45),
  },
  withPrefix: { paddingLeft: 30 },
  prefixBox: {
    position: "absolute",
    left: 16,
    top: 0,
    bottom: 0,
    zIndex: 1,
    justifyContent: "center",
  },
  prefix: { color: colors.muted, ...font(700, 15) },
  focused: { borderColor: colors.brand },
});
