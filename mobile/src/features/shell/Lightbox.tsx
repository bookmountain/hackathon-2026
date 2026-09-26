import { useState } from "react";
import { Image, Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Icon } from "@/components/ui";
import { colors, font } from "@/theme";

type Props = { photos: string[]; start: number; onClose: () => void };

// Full-screen photo viewer: close, "2/4", prev/next and a thumbnail strip
export default function Lightbox({ photos, start, onClose }: Props) {
  const [index, setIndex] = useState(start);
  const multi = photos.length > 1;
  const step = (by: number) => setIndex((i) => (i + by + photos.length) % photos.length);

  return (
    <Modal visible animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <SafeAreaView style={styles.screen}>
        <View style={styles.header}>
          <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="Close" style={styles.close}>
            <Icon name="close" color={colors.surface} />
          </Pressable>
          <Text style={styles.count}>
            {index + 1} / {photos.length}
          </Text>
          <View style={styles.spacer} />
        </View>

        <View style={styles.stage}>
          <Image source={{ uri: photos[index] }} style={StyleSheet.absoluteFill} resizeMode="contain" accessibilityIgnoresInvertColors />
          {multi && (
            <>
              <Pressable onPress={() => step(-1)} accessibilityRole="button" accessibilityLabel="Previous photo" style={[styles.nav, { left: 12 }]}>
                <Icon name="back" color={colors.surface} />
              </Pressable>
              <Pressable onPress={() => step(1)} accessibilityRole="button" accessibilityLabel="Next photo" style={[styles.nav, { right: 12 }]}>
                <Icon name="chevronRight" color={colors.surface} />
              </Pressable>
            </>
          )}
        </View>

        {multi && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.thumbs} style={styles.strip}>
            {photos.map((uri, i) => (
              <Pressable
                key={uri}
                onPress={() => setIndex(i)}
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
      </SafeAreaView>
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
  stage: { flex: 1, justifyContent: "center" },
  nav: {
    position: "absolute",
    top: "50%",
    marginTop: -22,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.16)",
    alignItems: "center",
    justifyContent: "center",
  },
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
