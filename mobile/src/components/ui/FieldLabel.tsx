import type { ReactNode } from "react";
import { StyleSheet, Text } from "react-native";
import { colors, font } from "@/theme";

// Small grey label above form fields ("Title", "Price", …)
export default function FieldLabel({ children }: { children: ReactNode }) {
  return <Text style={styles.label}>{children}</Text>;
}

const styles = StyleSheet.create({
  label: { color: colors.muted, ...font(700, 13) },
});
