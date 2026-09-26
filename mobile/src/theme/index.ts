import type { ViewStyle } from "react-native";
import { colors } from "./colors";

export { colors } from "./colors";
export type { ColorName } from "./colors";
export { font, fontFamilies } from "./typography";
export type { FontWeight } from "./typography";

// Shadows used across pins, sheets and photos (CSS box-shadow equivalents)
export const shadows = {
  /** List cards: 2px ink border + 4px hard shadow */
  card: { borderWidth: 2, borderColor: colors.ink, boxShadow: `4px 4px 0 ${colors.ink}` },
  pin: { boxShadow: "0 3px 8px rgba(20,20,43,0.3)" },
  floating: { boxShadow: "0 3px 10px rgba(20,20,43,0.12)" },
  sheet: { boxShadow: "0 -4px 0 rgba(20,20,43,0.15)" },
  photoButton: { boxShadow: "0 2px 8px rgba(20,20,43,0.3)" },
} satisfies Record<string, ViewStyle>;

/** The design's neo-brutalist look: 2px ink border plus a hard offset shadow of `offset` px (0 = none) */
export function brutal(offset: 0 | 2 | 3 | 4 = 3): ViewStyle {
  return {
    borderWidth: 2,
    borderColor: colors.ink,
    ...(offset ? { boxShadow: `${offset}px ${offset}px 0 ${colors.ink}` } : null),
  };
}

/** 2px ink divider above or below a bar */
export const divider = {
  top: { borderTopWidth: 2, borderTopColor: colors.ink },
  bottom: { borderBottomWidth: 2, borderBottomColor: colors.ink },
} satisfies Record<string, ViewStyle>;
