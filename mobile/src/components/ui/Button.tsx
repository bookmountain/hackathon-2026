import type { ReactNode } from "react";
import { StyleSheet, Text, type StyleProp, type ViewStyle } from "react-native";
import { colors, font, type FontWeight } from "@/theme";
import GamePressable from "./GamePressable";

type Variant = "primary" | "outline" | "soft" | "yellow" | "flat";
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
  /** Layout only (flex, margins, alignSelf); the face is styled by variant and size */
  style?: StyleProp<ViewStyle>;
};

const SIZES: Record<Size, { height: number; radius: number; fontSize: number; padding: number }> = {
  lg: { height: 54, radius: 16, fontSize: 17, padding: 20 },
  md: { height: 48, radius: 14, fontSize: 17, padding: 16 },
  sm: { height: 38, radius: 11, fontSize: 13.5, padding: 16 },
};

const VARIANTS: Record<Variant, { bg: string; pressed: string; fg: string }> = {
  primary: { bg: colors.brand, pressed: colors.brandPressed, fg: colors.surface },
  outline: { bg: colors.surface, pressed: colors.brandSoft, fg: colors.ink },
  soft: { bg: colors.brandSoft, pressed: colors.brandSofter, fg: colors.brand },
  yellow: { bg: colors.yellow, pressed: colors.yellowPressed, fg: colors.ink },
  flat: { bg: colors.brand, pressed: colors.brandPressed, fg: colors.surface },
};

// Game-style button: ink border on an ink ledge it sinks into when pressed.
// lg and md are the design's big CTAs, set in 17px Bricolage.
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
  const cta = size !== "sm";
  return (
    <GamePressable
      kind={cta ? "cta" : "sm"}
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ disabled: greyed }}
      style={style}
      faceStyle={(pressed) => [
        styles.base,
        {
          height: s.height,
          borderRadius: s.radius,
          paddingHorizontal: s.padding,
          backgroundColor: greyed ? colors.disabled : pressed ? v.pressed : v.bg,
        },
      ]}
    >
      {icon}
      <Text style={[font(cta ? 800 : weight, s.fontSize), { color: greyed ? colors.surface : v.fg }]}>{label}</Text>
    </GamePressable>
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
