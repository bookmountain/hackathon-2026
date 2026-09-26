import { Image, StyleSheet, Text, View } from "react-native";
import type { AvatarIcon, AvatarRing, AvatarShape, AvatarStyle } from "@/api/types";
import { colors, font } from "@/theme";
import Icon, { type IconName } from "./Icon";

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

export const AVATAR_ICONS: Record<AvatarIcon, IconName> = {
  compass: "avCompass",
  book: "avBook",
  coffee: "avCoffee",
  music: "avMusic",
  code: "avCode",
  leaf: "avLeaf",
  camera: "avCamera",
  ball: "avBall",
  paw: "avPaw",
  rocket: "avRocket",
};

/** Corner radius as a share of the size: circle 50%, soft 32%, square 14% */
export const AVATAR_SHAPES: Record<AvatarShape, number> = { circle: 0.5, soft: 0.32, square: 0.14 };

export const AVATAR_RINGS: Record<AvatarRing, string | null> = {
  none: null,
  gold: "#F4B740",
  blue: "#2E5AA8",
  navy: "#14142B",
  sky: "#9AE6C4",
};

export const DEFAULT_AVATAR_STYLE: AvatarStyle = { mode: "initials", text: "", icon: "compass", shape: "circle", ring: "none" };

type Props = {
  index: number | null | undefined;
  nick: string;
  size?: number;
  /** Uploaded photo; wins over the preset colour */
  url?: string | null;
  /** Shape, ring and initials/icon (your own avatar); plain initial circle without it */
  look?: AvatarStyle | null;
};

export default function Avatar({ index, nick, size = 40, url, look: style }: Props) {
  const radius = size * AVATAR_SHAPES[style?.shape ?? "circle"];
  if (url) {
    return (
      <Image
        source={{ uri: url }}
        accessibilityIgnoresInvertColors
        style={{ width: size, height: size, borderRadius: radius, backgroundColor: colors.anon }}
      />
    );
  }
  const look = avatarLook(index, nick);
  const hidden = index == null || index < 0;
  const ring = style ? AVATAR_RINGS[style.ring] : null;
  const text = !hidden && style?.mode === "initials" && style.text ? style.text.toUpperCase() : look.text;
  const shape = AVATAR_SHAPES[style?.shape ?? "circle"];
  const face = (dim: number) => (
    <View style={[styles.face, { width: dim, height: dim, borderRadius: dim * shape, backgroundColor: look.bg }]}>
      {!hidden && style?.mode === "icon" ? (
        <Icon name={AVATAR_ICONS[style.icon]} size={Math.round(dim * 0.58)} color={look.fg} strokeWidth={2} />
      ) : (
        <Text style={[font(800, Math.round(dim * (text.length > 1 ? 0.34 : 0.4))), { color: look.fg }]}>{text}</Text>
      )}
    </View>
  );
  if (!ring) return face(size);
  // 4px ring and a 3px white gap, inside the same outer size
  return (
    <View style={[styles.face, { width: size, height: size, borderRadius: radius, borderWidth: 4, borderColor: ring, backgroundColor: colors.surface }]}>
      {face(size - 14)}
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
  face: { alignItems: "center", justifyContent: "center", overflow: "hidden" },
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
