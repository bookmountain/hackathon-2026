import type { ReactNode } from "react";
import { Pressable, StyleSheet, Text, type StyleProp, type ViewStyle } from "react-native";
import { brutal, colors, font, type FontWeight } from "@/theme";

type Variant = "primary" | "outline" | "soft" | "yellow" | "flat";
type Size = "lg" | "md" | "sm";

type Props = {
  label: string;
  onPress: () => void;
  variant?: Variant;
  size?: Size;
  /** Hard offset shadow under the ink border (px); 0 for none. Defaults per variant. */
  shadow?: 0 | 2 | 3 | 4;
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

// primary / yellow / outline get the design's 2px ink border; "flat" is primary without it
const VARIANTS: Record<Variant, { bg: string; pressed: string; fg: string; shadow: 0 | 2 | 3 | 4 | null }> = {
  primary: { bg: colors.brand, pressed: colors.brandPressed, fg: colors.surface, shadow: 3 },
  outline: { bg: colors.surface, pressed: colors.brandSoft, fg: colors.ink, shadow: 0 },
  soft: { bg: colors.brandSoft, pressed: colors.brandSofter, fg: colors.brand, shadow: null },
  yellow: { bg: colors.yellow, pressed: colors.yellowPressed, fg: colors.ink, shadow: 3 },
  flat: { bg: colors.brand, pressed: colors.brandPressed, fg: colors.surface, shadow: null },
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
  shadow,
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
        v.shadow !== null ? brutal(shadow ?? v.shadow) : null,
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
