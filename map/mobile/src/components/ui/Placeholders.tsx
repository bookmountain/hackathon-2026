import { useId, type ReactNode } from "react";
import { Platform, Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from "react-native";
import Svg, { Defs, Pattern, Rect } from "react-native-svg";
import { colors, font } from "@/theme";
import Icon from "./Icon";

type StripedProps = {
  tone: string;
  /** Stripe width in px, like the design's repeating-linear-gradient(135deg, tone 0 Npx, …) */
  stripe?: number;
  gap?: number;
  base?: string;
  label?: string;
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
};

// Diagonal-stripe stand-in for photos ("room photo", "product photo")
export function Striped({ tone, stripe = 12, gap = 2, base = colors.canvas, label, style, children }: StripedProps) {
  const id = `stripes${useId().replace(/:/g, "")}`;
  const size = stripe + gap;
  return (
    <View style={[styles.striped, style]}>
      <Svg style={StyleSheet.absoluteFill} width="100%" height="100%">
        <Defs>
          <Pattern id={id} width={size} height={size} patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <Rect width={size} height={size} fill={base} />
            <Rect width={stripe} height={size} fill={tone} />
          </Pattern>
        </Defs>
        <Rect width="100%" height="100%" fill={`url(#${id})`} />
      </Svg>
      {label ? <Text style={styles.stripedLabel}>{label}</Text> : null}
      {children}
    </View>
  );
}

// Dashed "Add photo" button; toggles a mock photo on/off
export function PhotoDropzone({ added, onPress, emptyText, addedText }: {
  added: boolean;
  onPress: () => void;
  emptyText: string;
  addedText: string;
}) {
  const content = (
    <>
      <Icon name="camera" size={26} color={colors.brand} />
      <Text style={styles.dropText}>{added ? addedText : emptyText}</Text>
    </>
  );
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={[styles.drop, { borderColor: added ? colors.brand : colors.brandLight }]}
    >
      {added ? (
        <Striped tone="#DCE6FF" stripe={10} gap={2} base={colors.canvas} style={styles.dropFill}>
          {content}
        </Striped>
      ) : (
        content
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  striped: { overflow: "hidden", alignItems: "center", justifyContent: "center" },
  stripedLabel: { color: colors.muted, fontFamily: Platform.select({ ios: "Menlo", default: "monospace" }), fontSize: 11 },
  drop: {
    height: 130,
    borderRadius: 18,
    borderWidth: 2,
    borderStyle: "dashed",
    backgroundColor: colors.canvas,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    overflow: "hidden",
  },
  dropFill: { ...StyleSheet.absoluteFill, gap: 6 },
  dropText: { color: colors.brand, ...font(700, 14) },
});
