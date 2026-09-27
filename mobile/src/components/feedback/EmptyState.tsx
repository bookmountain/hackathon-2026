import { StyleSheet, Text, View } from "react-native";
import { Sticker, type StickerName } from "@/components/ui";
import { colors, font } from "@/theme";

// Big sticker, a cheeky heading and a hint, for empty lists
export default function EmptyState({ sticker, title, text }: { sticker: StickerName; title: string; text: string }) {
  return (
    <View style={styles.wrap}>
      <Sticker name={sticker} size={84} />
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.text}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: "center", gap: 12, paddingVertical: 30, paddingHorizontal: 20 },
  title: { color: colors.ink, textAlign: "center", ...font(800, 19) },
  text: { color: colors.muted, textAlign: "center", ...font(600, 14, 1.5) },
});
