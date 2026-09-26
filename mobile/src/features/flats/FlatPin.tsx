import { StyleSheet, Text, View } from "react-native";
import type { Flat } from "@/data/types";
import { colors, font } from "@/theme";

// "$245/wk" price pill on the map; coral while its sheet is open
export default function FlatPin({ flat, selected }: { flat: Flat; selected: boolean }) {
  return (
    <View style={[styles.pin, { backgroundColor: selected ? colors.coral : colors.brand }]}>
      <Text style={styles.text}>${flat.price}/wk</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pin: {
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: colors.surface,
    boxShadow: "0 4px 12px rgba(20,20,43,0.4)",
  },
  text: { color: colors.surface, ...font(800, 12.5) },
});
