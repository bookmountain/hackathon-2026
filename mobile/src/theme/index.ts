import type { ViewStyle } from "react-native";
import { colors } from "./colors";

export { colors } from "./colors";
export type { ColorName } from "./colors";
export { font, fontFamilies } from "./typography";
export type { FontWeight } from "./typography";

// Shadows used across cards, pins and sheets (CSS box-shadow equivalents)
export const shadows = {
  card: {
    shadowColor: colors.ink,
    shadowOpacity: 0.05,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  pin: {
    shadowColor: colors.ink,
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  floating: {
    shadowColor: colors.ink,
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  sheet: {
    shadowColor: colors.ink,
    shadowOpacity: 0.28,
    shadowRadius: 50,
    shadowOffset: { width: 0, height: 20 },
    elevation: 12,
  },
} satisfies Record<string, ViewStyle>;
