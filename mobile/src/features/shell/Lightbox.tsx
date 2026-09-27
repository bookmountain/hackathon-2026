import { useRef, useState } from "react";
import { Image, Modal, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Icon } from "@/components/ui";
import { colors, font } from "@/theme";
import ZoomableImage from "./ZoomableImage";

type Props = { photos: string[]; start: number; onClose: () => void };

// Full-screen photo viewer: swipe between photos, pinch or double-tap to zoom, close, "2/4" and thumbnails
export default function Lightbox({ photos, start, onClose }: Props) {
  const { width } = useWindowDimensions();
  // A SafeAreaView inside a Modal gets zero insets on iOS, which put the close
  // button under the status bar where it can't be tapped; pad with the app's insets
  const insets = useSafeAreaInsets();
  const pager = useRef<ScrollView>(null);
  const [index, setIndex] = useState(start);
  const [stageHeight, setStageHeight] = useState(0);
  // Swiping to the next photo is off while this one is zoomed in
  const [zoomed, setZoomed] = useState(false);
  const multi = photos.length > 1;

  const show = (i: number) => {
    setIndex(i);
    setZoomed(false);
    pager.current?.scrollTo({ x: i * width, animated: true });
  };

  return (
    <Modal visible animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      {/* Gestures inside a Modal need their own root */}
      <GestureHandlerRootView style={[styles.screen, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
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
          scrollEnabled={!zoomed}
          scrollEventThrottle={32}
          onScroll={(e) => setIndex(Math.round(e.nativeEvent.contentOffset.x / width))}
          onLayout={(e) => setStageHeight(e.nativeEvent.layout.height)}
          style={styles.stage}
        >
          {stageHeight > 0 &&
            photos.map((uri, i) => (
              <ZoomableImage
                key={uri}
                uri={uri}
                width={width}
                height={stageHeight}
                active={i === index}
                zoomed={zoomed && i === index}
                onZoomChange={setZoomed}
                accessibilityLabel={`Photo ${i + 1} of ${photos.length}`}
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
      </GestureHandlerRootView>
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
