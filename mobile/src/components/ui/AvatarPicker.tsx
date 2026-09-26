import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, font } from "@/theme";
import { AVATAR_COLORS, avatarLook } from "./Avatar";

const OPTIONS = [-1, ...AVATAR_COLORS.map((_, i) => i)];
const COLUMNS = 5;
const GAP = 10;

type Props = {
  value: number;
  nick: string;
  onChange: (index: number) => void;
  size?: number;
};

// Grid of avatar colours with the nickname's initial; "?" = stay without an avatar
export default function AvatarPicker({ value, nick, onChange, size = 20 }: Props) {
  return (
    <View style={styles.grid}>
      {OPTIONS.map((i) => {
        const look = avatarLook(i, nick || "You");
        const selected = value === i;
        return (
          <View key={i} style={styles.cell}>
            <Pressable
              onPress={() => onChange(i)}
              accessibilityRole="button"
              accessibilityLabel={i < 0 ? "No avatar" : `Avatar colour ${i + 1}`}
              accessibilityState={{ selected }}
              style={[
                styles.option,
                { backgroundColor: look.bg, borderColor: selected ? colors.brand : "transparent" },
              ]}
            >
              <Text style={[font(800, size), { color: look.fg }]}>{look.text}</Text>
            </Pressable>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: "row", flexWrap: "wrap", marginHorizontal: -GAP / 2, rowGap: GAP },
  cell: { width: `${100 / COLUMNS}%`, paddingHorizontal: GAP / 2 },
  option: {
    aspectRatio: 1,
    borderRadius: 999,
    borderWidth: 3,
    alignItems: "center",
    justifyContent: "center",
  },
});
