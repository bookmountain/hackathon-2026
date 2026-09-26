import { Image, StyleSheet, Text, View } from "react-native";
import { colors, font } from "@/theme";

// Avatar palette from the design: [background, text]
export const AVATAR_COLORS: readonly (readonly [string, string])[] = [
  ["#2E5AA8", "#fff"],
  ["#F4B740", "#14142B"],
  ["#FF6B4A", "#fff"],
  ["#14142B", "#fff"],
  ["#9AE6C4", "#14142B"],
  ["#C9B8FF", "#14142B"],
  ["#FFB4C6", "#14142B"],
  ["#EFF0FF", "#14142B"],
];

/** -1 / null = no avatar chosen: grey "?" */
export function avatarLook(index: number | null | undefined, nick: string) {
  if (index == null || index < 0) return { bg: colors.anon, fg: colors.muted, text: "?" };
  const [bg, fg] = AVATAR_COLORS[index % AVATAR_COLORS.length];
  const initial = nick.replace(/[^A-Za-z]/g, "").charAt(0) || "U";
  return { bg, fg, text: initial.toUpperCase() };
}

type Props = {
  index: number | null | undefined;
  nick: string;
  size?: number;
  /** Uploaded photo; wins over the preset colour */
  url?: string | null;
};

export default function Avatar({ index, nick, size = 40, url }: Props) {
  if (url) {
    return (
      <Image
        source={{ uri: url }}
        accessibilityIgnoresInvertColors
        style={[styles.circle, { width: size, height: size, backgroundColor: colors.anon }]}
      />
    );
  }
  const look = avatarLook(index, nick);
  return (
    <View style={[styles.circle, { width: size, height: size, backgroundColor: look.bg }]}>
      <Text style={[font(800, Math.round(size * 0.4)), { color: look.fg }]}>{look.text}</Text>
    </View>
  );
}

/** Stacked "?" circles: hosts and guests stay anonymous, only a headcount shows */
export function AnonDots({ count, max = 5 }: { count: number; max?: number }) {
  return (
    <View style={styles.dots}>
      {Array.from({ length: Math.min(max, count) }, (_, i) => (
        <View key={i} style={styles.dot}>
          <Text style={[font(800, 10), { color: colors.faint }]}>?</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  circle: { borderRadius: 999, alignItems: "center", justifyContent: "center" },
  dots: { flexDirection: "row", paddingLeft: 6 },
  dot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    marginLeft: -6,
    backgroundColor: colors.anon,
    borderWidth: 2,
    borderColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
});
