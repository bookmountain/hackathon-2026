import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors, divider, font } from "@/theme";
import GamePressable from "./GamePressable";
import Icon from "./Icon";

type BackButtonProps = { onPress: () => void; variant?: "soft" | "white" };

// Round back button: soft blue on white pages, white on top of photos
export function BackButton({ onPress, variant = "soft" }: BackButtonProps) {
  return (
    <GamePressable
      kind="round"
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="Back"
      hitSlop={6}
      faceStyle={[styles.back, { backgroundColor: variant === "soft" ? colors.brandSoft : colors.surface }]}
    >
      <Icon name="back" color={colors.ink} />
    </GamePressable>
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
