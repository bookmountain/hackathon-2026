import { useState, type ReactNode } from "react";
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Striped } from "@/components/ui";
import { colors, font } from "@/theme";
import Lightbox from "./Lightbox";

type Props = {
  photos: string[];
  tone: string;
  /** Placeholder label when there are no photos */
  label: string;
  /** Visible height below the status bar; the photos also run up under it */
  height: number;
  /** Drawn over the photos, e.g. the back button */
  children?: ReactNode;
};

// Swipeable photos at the top of a detail screen, with a "2/4" counter and dots.
// Tapping a photo opens it full screen.
export default function PhotoPager({ photos, tone, label, height: visibleHeight, children }: Props) {
  const insets = useSafeAreaInsets();
  const height = visibleHeight + insets.top;
  const [width, setWidth] = useState(0);
  const [page, setPage] = useState(0);
  const [open, setOpen] = useState<number | null>(null);

  if (!photos.length) {
    return (
      <Striped tone={tone} stripe={14} label={label} style={{ height }}>
        {children}
      </Striped>
    );
  }

  const multi = photos.length > 1;
  return (
    <View style={{ height, backgroundColor: colors.brandSoft }} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
      {width > 0 && (
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          scrollEventThrottle={32}
          onScroll={(e) => setPage(Math.round(e.nativeEvent.contentOffset.x / width))}
        >
          {photos.map((uri, i) => (
            <Pressable
              key={uri}
              onPress={() => setOpen(i)}
              accessibilityRole="imagebutton"
              accessibilityLabel={`Photo ${i + 1} of ${photos.length}, open full screen`}
            >
              <Image source={{ uri }} style={{ width, height }} resizeMode="cover" accessibilityIgnoresInvertColors />
            </Pressable>
          ))}
        </ScrollView>
      )}
      {multi && (
        <>
          {/* Level with the back button, below the status bar */}
          <View style={[styles.counter, { top: insets.top + 21 }]} pointerEvents="none">
            <Text style={styles.counterText}>
              {page + 1}/{photos.length}
            </Text>
          </View>
          <View style={styles.dots} pointerEvents="none">
            {photos.map((uri, i) => (
              <View key={uri} style={[styles.dot, { backgroundColor: i === page ? colors.surface : "rgba(255,255,255,0.5)" }]} />
            ))}
          </View>
        </>
      )}
      {children}
      {open !== null && <Lightbox photos={photos} start={open} onClose={() => setOpen(null)} />}
    </View>
  );
}

const styles = StyleSheet.create({
  counter: {
    position: "absolute",
    right: 14,
    backgroundColor: "rgba(20,20,43,0.72)",
    borderRadius: 999,
    paddingHorizontal: 11,
    paddingVertical: 5,
  },
  counterText: { color: colors.surface, ...font(700, 12) },
  dots: { position: "absolute", left: 0, right: 0, bottom: 12, flexDirection: "row", justifyContent: "center", gap: 6 },
  dot: { width: 7, height: 7, borderRadius: 4, boxShadow: "0 1px 2px rgba(0,0,0,0.35)" },
});
