import type { TextStyle } from "react-native";

// Fonts loaded in src/app/_layout.tsx. The design sets all 800-weight display
// text (titles, prices, CTAs) in Bricolage Grotesque and everything else in DM Sans.
export const fontFamilies = {
  400: "DMSans_400Regular",
  500: "DMSans_500Medium",
  600: "DMSans_600SemiBold",
  700: "DMSans_700Bold",
  800: "BricolageGrotesque_800ExtraBold",
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
