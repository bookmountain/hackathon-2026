import { memo } from "react";
import { Platform, StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { SvgXml } from "react-native-svg";
import { silhouette, STICKERS, svgDoc, type StickerName } from "./stickers";

type Props = {
  name: StickerName;
  size: number;
  /** Degrees */
  rotate?: number;
  style?: StyleProp<ViewStyle>;
};

// The design's 2px white die-cut edge is four white copies nudged up, down, left and right
const EDGE = 2;
const OFFSETS = [
  { left: EDGE, top: 0 },
  { left: -EDGE, top: 0 },
  { left: 0, top: EDGE },
  { left: 0, top: -EDGE },
];

const ART = Object.fromEntries(
  Object.entries(STICKERS).map(([k, markup]) => [k, { art: svgDoc(markup), edge: svgDoc(silhouette(markup)) }]),
) as Record<StickerName, { art: string; edge: string }>;

// Cartoon sticker (koala, roo sign, sunny, meat pie…) with a white border and soft drop shadow
function Sticker({ name, size, rotate, style }: Props) {
  const { art, edge } = ART[name];
  return (
    <View
      pointerEvents="none"
      style={[
        { width: size, height: size },
        styles.shadow,
        rotate ? { transform: [{ rotate: `${rotate}deg` }] } : null,
        style,
      ]}
    >
      {OFFSETS.map((o, i) => (
        <SvgXml key={i} xml={edge} width={size} height={size} style={[styles.layer, o]} />
      ))}
      <SvgXml xml={art} width={size} height={size} style={styles.layer} />
    </View>
  );
}

export default memo(Sticker);

const styles = StyleSheet.create({
  layer: { position: "absolute" },
  // iOS casts the shadow from the artwork's shape; Android has no equivalent for a transparent view
  shadow: Platform.select({
    ios: { shadowColor: "#14142B", shadowOpacity: 0.3, shadowRadius: 3, shadowOffset: { width: 0, height: 5 } },
    default: {},
  }),
});
