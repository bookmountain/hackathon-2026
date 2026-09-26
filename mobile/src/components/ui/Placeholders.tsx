import { useState, type ReactNode } from "react";
import { Platform, Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from "react-native";
import Svg, { Path } from "react-native-svg";
import { colors, font } from "@/theme";
import Icon from "./Icon";

type StripedProps = {
  tone: string;
  /** Band width in px, like the design's repeating-linear-gradient(135deg, tone 0 Npx, base Npx N+gap px) */
  stripe?: number;
  gap?: number;
  base?: string;
  label?: string;
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
};

// Diagonal-stripe stand-in for photos ("room photo", "product photo"): the tone
// crossed by thin "/" lines of the base colour, drawn once the size is known.
export function Striped({ tone, stripe = 12, gap = 2, base = colors.canvas, label, style, children }: StripedProps) {
  const [size, setSize] = useState({ width: 0, height: 0 });
  // Lines run at 45°, so the horizontal distance between them is period × √2
  const step = (stripe + gap) * Math.SQRT2;
  const lines: string[] = [];
  for (let x = 0; x < size.width + size.height; x += step) {
    lines.push(`M${x} 0L${x - size.height} ${size.height}`);
  }
  return (
    <View
      style={[styles.striped, { backgroundColor: tone }, style]}
      onLayout={(e) => setSize(e.nativeEvent.layout)}
    >
      {size.width > 0 && (
        <Svg style={StyleSheet.absoluteFill} width={size.width} height={size.height}>
          <Path d={lines.join("")} stroke={base} strokeWidth={gap * Math.SQRT2} />
        </Svg>
      )}
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
