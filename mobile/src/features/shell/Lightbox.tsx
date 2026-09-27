import { useRef, useState } from "react";
import { Image, Modal, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Icon } from "@/components/ui";
import { colors, font } from "@/theme";

type Props = { photos: string[]; start: number; onClose: () => void };

// Full-screen photo viewer: swipe between photos, close, "2/4" and a thumbnail strip
export default function Lightbox({ photos, start, onClose }: Props) {
  const { width } = useWindowDimensions();
  // A SafeAreaView inside a Modal gets zero insets on iOS, which put the close
  // button under the status bar where it can't be tapped; pad with the app's insets
  const insets = useSafeAreaInsets();
  const pager = useRef<ScrollView>(null);
  const [index, setIndex] = useState(start);
  const multi = photos.length > 1;

  const show = (i: number) => {
    setIndex(i);
    pager.current?.scrollTo({ x: i * width, animated: true });
  };

  return (
    <Modal visible animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <View style={[styles.screen, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <View style={styles.header}>
          <Pressable onPress={onClose} hitSlop={8} accessibilityRole="button" accessibilityLabel="Close" style={styles.close}>
            <Icon name="close" color={colors.surface} />
          </Pressable>
          <Text style={styles.count}>
            {index + 1} / {photos.length}
          </Text>
          <View style={styles.spacer} />
        </View>

        <ScrollView
          ref={pager}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          contentOffset={{ x: start * width, y: 0 }}
          scrollEventThrottle={32}
          onScroll={(e) => setIndex(Math.round(e.nativeEvent.contentOffset.x / width))}
          style={styles.stage}
        >
          {photos.map((uri, i) => (
            <Image
              key={uri}
              source={{ uri }}
              style={{ width }}
              resizeMode="contain"
              accessibilityLabel={`Photo ${i + 1} of ${photos.length}`}
              accessibilityIgnoresInvertColors
            />
          ))}
        </ScrollView>

        {multi && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.thumbs} style={styles.strip}>
            {photos.map((uri, i) => (
              <Pressable
                key={uri}
                onPress={() => show(i)}
                accessibilityRole="button"
                accessibilityLabel={`Photo ${i + 1}`}
                accessibilityState={{ selected: i === index }}
                style={[styles.thumb, { borderColor: i === index ? colors.yellow : "transparent", opacity: i === index ? 1 : 0.55 }]}
              >
                <Image source={{ uri }} style={StyleSheet.absoluteFill} resizeMode="cover" accessibilityIgnoresInvertColors />
              </Pressable>
            ))}
          </ScrollView>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.lightbox },
  header: { height: 56, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16 },
  close: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.14)",
    alignItems: "center",
    justifyContent: "center",
  },
  count: { color: colors.surface, ...font(700, 13) },
  spacer: { width: 40 },
  stage: { flex: 1 },
  strip: { flexGrow: 0 },
  thumbs: { height: 78, gap: 8, paddingTop: 10, paddingHorizontal: 16, paddingBottom: 20 },
  thumb: {
    width: 56,
    height: 48,
    borderRadius: 10,
    borderWidth: 2.5,
    overflow: "hidden",
    backgroundColor: colors.lightboxThumb,
  },
});
