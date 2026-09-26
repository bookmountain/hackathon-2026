import type { ReactNode } from "react";
import { Image, StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { Striped } from "./Placeholders";

type Props = {
  /** Photo URL; without one the striped placeholder shows */
  uri: string | null | undefined;
  tone: string;
  label?: string;
  stripe?: number;
  base?: string;
  style?: StyleProp<ViewStyle>;
  /** Badges drawn over the photo */
  children?: ReactNode;
};

// A listing photo, or the design's striped stand-in when there isn't one
export default function Photo({ uri, tone, label, stripe, base, style, children }: Props) {
  if (!uri) {
    return (
      <Striped tone={tone} label={label} stripe={stripe} base={base} style={style}>
        {children}
      </Striped>
    );
  }
  return (
    <View style={[styles.frame, { backgroundColor: tone }, style]}>
      <Image source={{ uri }} style={StyleSheet.absoluteFill} resizeMode="cover" accessibilityIgnoresInvertColors />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  frame: { overflow: "hidden" },
});
