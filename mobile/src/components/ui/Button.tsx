import type { ReactNode } from "react";
import { Pressable, StyleSheet, Text, type StyleProp, type ViewStyle } from "react-native";
import { colors, font, type FontWeight } from "@/theme";

type Variant = "primary" | "outline" | "soft" | "yellow";
type Size = "lg" | "md" | "sm";

type Props = {
  label: string;
  onPress: () => void;
  variant?: Variant;
  size?: Size;
  /** Looks disabled (grey-blue) but stays tappable, like the design: a tap explains what's missing */
  inactive?: boolean;
  disabled?: boolean;
  icon?: ReactNode;
  weight?: FontWeight;
  style?: StyleProp<ViewStyle>;
};

const SIZES: Record<Size, { height: number; radius: number; fontSize: number; padding: number }> = {
  lg: { height: 54, radius: 16, fontSize: 16, padding: 20 },
  md: { height: 48, radius: 14, fontSize: 15, padding: 16 },
  sm: { height: 38, radius: 11, fontSize: 13.5, padding: 16 },
};

const VARIANTS: Record<Variant, { bg: string; pressed: string; fg: string; border?: string }> = {
  primary: { bg: colors.brand, pressed: colors.brandPressed, fg: colors.surface },
  outline: { bg: colors.surface, pressed: colors.canvas, fg: colors.ink, border: colors.line },
  soft: { bg: colors.brandSoft, pressed: colors.brandSofter, fg: colors.brand },
  yellow: { bg: colors.yellow, pressed: "#F5BC2A", fg: colors.ink },
};

export default function Button({
  label,
  onPress,
  variant = "primary",
  size = "lg",
  inactive = false,
  disabled = false,
  icon,
  weight = 800,
  style,
}: Props) {
  const s = SIZES[size];
  const v = VARIANTS[variant];
  const greyed = inactive || disabled;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ disabled: greyed }}
      style={({ pressed }) => [
        styles.base,
        {
          height: s.height,
          borderRadius: s.radius,
          paddingHorizontal: s.padding,
          backgroundColor: greyed ? colors.disabled : pressed ? v.pressed : v.bg,
        },
        v.border && !greyed ? { borderWidth: 1.5, borderColor: v.border } : null,
        style,
      ]}
    >
      {icon}
      <Text style={[font(weight, s.fontSize), { color: greyed ? colors.surface : v.fg }]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
});
