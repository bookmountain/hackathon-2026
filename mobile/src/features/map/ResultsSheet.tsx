import type { ReactNode } from "react";
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { colors, font } from "@/theme";
import MapSheet from "./MapSheet";

export type ResultRow = {
  key: string;
  title: string;
  sub: string;
  /** Price or headcount on the right */
  right: string;
  image: string | null;
  onPress: () => void;
};

type Props = {
  title: string;
  rows: ResultRow[];
  onClose: () => void;
  /** Shown above the title, e.g. the image-search status */
  header?: ReactNode;
  /** Shown when there are no rows; null hides it (e.g. while loading) */
  emptyText?: string | null;
};

// Search results over the map: "3 rooms for “ensuite”", one row per match
export default function ResultsSheet({ title, rows, onClose, header, emptyText }: Props) {
  return (
    <MapSheet>
      {header}
      <View style={styles.head}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        <Pressable onPress={onClose} accessibilityRole="button" hitSlop={8}>
          <Text style={styles.close}>Close</Text>
        </Pressable>
      </View>
      <ScrollView style={styles.list} contentContainerStyle={styles.rows} keyboardShouldPersistTaps="handled">
        {rows.map((r) => (
          <Pressable
            key={r.key}
            onPress={r.onPress}
            accessibilityRole="button"
            style={({ pressed }) => [styles.row, pressed && { backgroundColor: colors.brandSoft }]}
          >
            <View style={styles.thumb}>
              {r.image && (
                <Image source={{ uri: r.image }} style={StyleSheet.absoluteFill} accessibilityIgnoresInvertColors />
              )}
            </View>
            <View style={styles.text}>
              <Text style={styles.rowTitle} numberOfLines={1}>
                {r.title}
              </Text>
              <Text style={styles.rowSub} numberOfLines={1}>
                {r.sub}
              </Text>
            </View>
            <Text style={styles.right}>{r.right}</Text>
          </Pressable>
        ))}
        {rows.length === 0 && emptyText ? <Text style={styles.empty}>{emptyText}</Text> : null}
      </ScrollView>
    </MapSheet>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: "row", justifyContent: "space-between", alignItems: "baseline", gap: 10 },
  title: { flex: 1, minWidth: 0, color: colors.ink, ...font(800, 17) },
  close: { color: colors.brand, ...font(700, 13) },
  list: { maxHeight: 300 },
  rows: { gap: 8 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: colors.canvas,
    borderRadius: 14,
    padding: 8,
  },
  thumb: { width: 56, height: 56, borderRadius: 10, overflow: "hidden", backgroundColor: colors.brandSofter },
  text: { flex: 1, minWidth: 0, gap: 3 },
  rowTitle: { color: colors.ink, ...font(800, 14) },
  rowSub: { color: colors.muted, ...font(600, 12.5) },
  right: { color: colors.brand, paddingRight: 6, ...font(800, 14) },
  empty: { paddingVertical: 18, paddingHorizontal: 8, textAlign: "center", color: colors.muted, ...font(600, 14, 1.5) },
});
