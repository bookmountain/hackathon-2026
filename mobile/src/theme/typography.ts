import type { TextStyle } from "react-native";

// Plus Jakarta Sans weights used by the design, loaded in src/app/_layout.tsx
export const fontFamilies = {
  500: "PlusJakartaSans_500Medium",
  600: "PlusJakartaSans_600SemiBold",
  700: "PlusJakartaSans_700Bold",
  800: "PlusJakartaSans_800ExtraBold",
} as const;

export type FontWeight = keyof typeof fontFamilies;

/**
 * Mirrors the CSS `font: <weight> <size>/<lineHeight>` shorthand in the design.
 * `lineHeight` is a multiplier (1.45) like CSS; `tracking` is in em (-0.02).
 */
export function font(
  weight: FontWeight,
  size: number,
  lineHeight?: number,
  tracking?: number,
): TextStyle {
  return {
    fontFamily: fontFamilies[weight],
    fontSize: size,
    ...(lineHeight ? { lineHeight: Math.round(size * lineHeight) } : null),
    ...(tracking ? { letterSpacing: size * tracking } : null),
  };
}
