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
  /** Pill text before any photo is picked, e.g. "Upload product photo" */
  emptyText: string;
  /** "Use a demo photo" under the box while it's empty */
  onDemo?: () => void;
};

// Dashed photo box: the cover photo fills it, the rest sit in a row below (tap one to remove)
export function PhotoDropzone({ photos, max, onAdd, onRemove, emptyText, onDemo }: DropzoneProps) {
  const cover = photos[0];
  const full = photos.length >= max;
  const pill = !cover ? emptyText : full ? `${max} of ${max} photos` : "Add more photos";
  return (
    <View style={styles.picked}>
      <Pressable
        onPress={onAdd}
        disabled={full}
        accessibilityRole="button"
        accessibilityLabel={pill}
        style={[styles.drop, { borderColor: cover ? colors.brand : colors.brandLight }]}
      >
        {cover && <Image source={{ uri: cover }} style={StyleSheet.absoluteFill} accessibilityIgnoresInvertColors />}
        <View style={styles.dropPill}>
          <Icon name="camera" size={20} color={colors.brand} />
          <Text style={styles.dropText}>{pill}</Text>
        </View>
      </Pressable>
      {!cover && onDemo && (
        <Pressable onPress={onDemo} accessibilityRole="button" style={styles.demo}>
          <Text style={styles.demoText}>Use a demo photo</Text>
        </Pressable>
      )}
      {cover && (
        <>
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
          </ScrollView>
          <Text style={styles.pickedText}>
            {photos.length} of {max} photos · the first is the cover · tap one to remove
          </Text>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  striped: { overflow: "hidden", alignItems: "center", justifyContent: "center" },
  stripedLabel: { color: colors.muted, fontFamily: Platform.select({ ios: "Menlo", default: "monospace" }), fontSize: 11 },
  drop: {
    height: 150,
    borderRadius: 18,
    borderWidth: 2,
    borderStyle: "dashed",
    backgroundColor: colors.canvas,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  dropPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(255,255,255,0.94)",
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  dropText: { color: colors.brand, ...font(700, 14) },
  demo: {
    alignSelf: "flex-start",
    backgroundColor: colors.brandSoft,
    borderRadius: 999,
    paddingHorizontal: 13,
    paddingVertical: 7,
  },
  demoText: { color: colors.brand, ...font(700, 12.5) },
  picked: { gap: 8 },
  thumbs: { gap: 8 },
  thumb: { width: 64, height: 64, borderRadius: 12, overflow: "hidden", backgroundColor: colors.canvas },
  remove: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "rgba(20,20,43,0.72)",
    alignItems: "center",
    justifyContent: "center",
  },
  removeText: { color: colors.surface, ...font(800, 14, 1) },
  pickedText: { color: colors.muted, ...font(600, 12) },
});
