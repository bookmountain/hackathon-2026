import type { ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, divider, font, shadows } from "@/theme";
import Icon from "./Icon";

type BackButtonProps = { onPress: () => void; variant?: "soft" | "white" };

// Round back button: soft blue on white pages, white on top of photos
export function BackButton({ onPress, variant = "soft" }: BackButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="Back"
      hitSlop={6}
      style={[styles.back, { backgroundColor: variant === "soft" ? colors.brandSoft : colors.surface }, variant === "white" && shadows.photoButton]}
    >
      <Icon name="back" color={colors.ink} />
    </Pressable>
  );
}

type Props = {
  onBack: () => void;
  title?: string;
  /** Custom content instead of a plain title (e.g. the chat partner) */
  children?: ReactNode;
  bordered?: boolean;
  height?: number;
};

// "‹  Title" bar used by forms, chats and profile
export default function ScreenHeader({ onBack, title, children, bordered = true, height = 56 }: Props) {
  return (
    <View style={[styles.bar, { height }, bordered && styles.bordered]}>
      <BackButton onPress={onBack} />
      {children ?? (title ? <Text style={styles.title}>{title}</Text> : null)}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    backgroundColor: colors.surface,
  },
  bordered: divider.bottom,
  back: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  title: { color: colors.ink, ...font(800, 18) },
});
