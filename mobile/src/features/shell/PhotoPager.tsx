import { useState, type ReactNode } from "react";
import { Image, ScrollView, StyleSheet, Text, View } from "react-native";
import { Striped } from "@/components/ui";
import { colors, font } from "@/theme";

type Props = {
  photos: string[];
  tone: string;
  /** Placeholder label when there are no photos */
  label: string;
  height: number;
  /** Drawn over the photos, e.g. the back button */
  children?: ReactNode;
};

// Swipeable photos at the top of a detail screen, with a "2/4" counter
export default function PhotoPager({ photos, tone, label, height, children }: Props) {
  const [width, setWidth] = useState(0);
  const [page, setPage] = useState(0);

  if (!photos.length) {
    return (
      <Striped tone={tone} stripe={14} label={label} style={{ height }}>
        {children}
      </Striped>
    );
  }

  return (
    <View style={{ height, backgroundColor: tone }} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
      {width > 0 && (
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={(e) => setPage(Math.round(e.nativeEvent.contentOffset.x / width))}
        >
          {photos.map((uri) => (
            <Image key={uri} source={{ uri }} style={{ width, height }} resizeMode="cover" accessibilityIgnoresInvertColors />
          ))}
        </ScrollView>
      )}
      {photos.length > 1 && (
        <View style={styles.counter} pointerEvents="none">
          <Text style={styles.counterText}>
            {page + 1}/{photos.length}
          </Text>
        </View>
      )}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  counter: {
    position: "absolute",
    right: 14,
    bottom: 14,
    backgroundColor: "rgba(20,20,43,0.72)",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  counterText: { color: colors.surface, ...font(700, 12) },
});
