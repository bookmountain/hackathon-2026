import { useState, type ReactNode } from "react";
import { Image, Platform, Pressable, ScrollView, StyleSheet, Text, View, type StyleProp, type ViewStyle } from "react-native";
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

type DropzoneProps = {
  /** Local image URIs, in order; the first is the cover */
  photos: string[];
  max: number;
  onAdd: () => void;
  onRemove: (index: number) => void;
  emptyText: string;
};

// Dashed "Add photo" box; once photos are picked it shows them (tap one to remove)
export function PhotoDropzone({ photos, max, onAdd, onRemove, emptyText }: DropzoneProps) {
  if (photos.length === 0) {
    return (
      <Pressable onPress={onAdd} accessibilityRole="button" style={[styles.drop, { borderColor: colors.brandLight }]}>
        <Icon name="camera" size={26} color={colors.brand} />
        <Text style={styles.dropText}>{emptyText}</Text>
      </Pressable>
    );
  }
  return (
    <View style={styles.picked}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.thumbs}>
        {photos.map((uri, i) => (
          <Pressable
            key={uri}
            onPress={() => onRemove(i)}
            accessibilityRole="button"
            accessibilityLabel={`Remove photo ${i + 1}`}
            style={styles.thumb}
          >
            <Image source={{ uri }} style={StyleSheet.absoluteFill} accessibilityIgnoresInvertColors />
            <View style={styles.remove}>
              <Text style={styles.removeText}>×</Text>
            </View>
          </Pressable>
        ))}
        {photos.length < max && (
          <Pressable onPress={onAdd} accessibilityRole="button" accessibilityLabel="Add photo" style={[styles.thumb, styles.add]}>
            <Icon name="plus" size={22} color={colors.brand} />
          </Pressable>
        )}
      </ScrollView>
      <Text style={styles.pickedText}>
        {photos.length} of {max} photos · the first is the cover · tap one to remove
      </Text>
    </View>
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
  dropText: { color: colors.brand, ...font(700, 14) },
  picked: { gap: 8 },
  thumbs: { gap: 8 },
  thumb: { width: 104, height: 104, borderRadius: 16, overflow: "hidden", backgroundColor: colors.canvas },
  add: {
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: colors.brandLight,
    alignItems: "center",
    justifyContent: "center",
  },
  remove: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "rgba(10,26,63,0.7)",
    alignItems: "center",
    justifyContent: "center",
  },
  removeText: { color: colors.surface, ...font(800, 14, 1) },
  pickedText: { color: colors.muted, ...font(600, 12) },
});
