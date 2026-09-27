import { Pressable, StyleSheet } from "react-native";
import { Sticker } from "@/components/ui";
import { useStickerPop } from "./StickerPop";

// Koala peeking in from the right edge of the tabs; a tap brings a random sticker pop
export default function KoalaPeek() {
  const pop = useStickerPop();
  return (
    <Pressable onPress={() => pop()} accessibilityRole="button" accessibilityLabel="Koala" style={styles.peek}>
      <Sticker name="koala" size={60} rotate={-90} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  peek: { position: "absolute", right: -24, top: "39%", zIndex: 9 },
});
