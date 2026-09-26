import { StyleSheet, Text, View } from "react-native";
import { colors, font } from "@/theme";

// Small legend in the lower-left corner of the map ("Rooms listed by students · tap a price")
export default function MapHint({ text }: { text: string }) {
  return (
    <View pointerEvents="none" style={styles.hint}>
      <Text style={styles.text}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  hint: {
    position: "absolute",
    left: 14,
    bottom: 14,
    zIndex: 6,
    maxWidth: 240,
    backgroundColor: "rgba(255,255,255,0.96)",
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 9,
    shadowColor: colors.ink,
    shadowOpacity: 0.12,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  text: { color: colors.body, ...font(600, 11.5, 1.35) },
});
