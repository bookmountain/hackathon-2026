import { StyleSheet, Text, View } from "react-native";
import { colors, font, type FontWeight } from "@/theme";

type Props = {
  label: string;
  bg?: string;
  fg?: string;
  size?: number;
  weight?: FontWeight;
  dashed?: boolean;
};

// Rounded label: "+$25 bills", "From 14 Oct", "6 min to Adelaide Uni", house-rhythm tags
export default function Pill({ label, bg = colors.brandSoft, fg = colors.brandDeep, size = 11.5, weight = 700, dashed }: Props) {
  return (
    <View
      style={[
        styles.pill,
        dashed ? { borderWidth: 1.5, borderStyle: "dashed", borderColor: colors.brandLight } : { backgroundColor: bg },
      ]}
    >
      <Text style={[font(weight, size), { color: fg }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: { alignSelf: "flex-start", borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 },
});
