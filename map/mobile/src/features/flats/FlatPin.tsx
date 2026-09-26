import { Pressable, StyleSheet, Text } from "react-native";
import { Icon } from "@/components/ui";
import type { Flat } from "@/data/types";
import { colors, font, shadows } from "@/theme";

// "$245/wk" price tag on the map; blue while its sheet is open
export default function FlatPin({ flat, selected, onPress }: { flat: Flat; selected: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${flat.title}, $${flat.price} per week`}
      style={[styles.pin, { backgroundColor: selected ? colors.brand : colors.ink }]}
    >
      <Icon name="house" size={12} color={colors.surface} />
      <Text style={styles.text}>${flat.price}/wk</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pin: {
    height: 28,
    paddingHorizontal: 10,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: colors.surface,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    ...shadows.pin,
  },
  text: { color: colors.surface, ...font(800, 12.5) },
});
