import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Photo } from "@/components/ui";
import type { Item } from "@/data/types";
import { recommendItems } from "@/features/persona/recommend";
import { usePersona } from "@/features/persona/usePersona";
import { colors, font } from "@/theme";

// "Picked for you": up to four unsold items matching your interests, above the grid
export default function PickedForYou({ items, onOpen }: { items: Item[]; onOpen: (id: string) => void }) {
  const { persona } = usePersona();
  const picks = recommendItems(items, persona);
  if (!picks.length) return null;
  return (
    <View style={styles.section}>
      <Text style={styles.title}>Picked for you</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.bleed} contentContainerStyle={styles.row}>
        {picks.map((i) => (
          <Pressable
            key={i.id}
            onPress={() => onOpen(i.id)}
            accessibilityRole="button"
            accessibilityLabel={`${i.title}, $${i.price}`}
            style={({ pressed }) => [styles.card, pressed && { opacity: 0.85 }]}
          >
            <Photo uri={i.photo} tone={i.tone} style={styles.photo} />
            <View style={styles.text}>
              <Text style={styles.price}>${i.price}</Text>
              <Text style={styles.name} numberOfLines={1}>
                {i.title}
              </Text>
            </View>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: 8 },
  title: { color: colors.ink, ...font(800, 15) },
  // Scrolls edge to edge past the list's 18px padding
  bleed: { marginHorizontal: -18 },
  row: { paddingHorizontal: 18, paddingBottom: 2, gap: 10 },
  card: { width: 130, backgroundColor: colors.surface, borderRadius: 16, overflow: "hidden" },
  photo: { width: 130, height: 96, backgroundColor: colors.brandSoft },
  text: { paddingHorizontal: 10, paddingTop: 8, paddingBottom: 10, gap: 2 },
  price: { color: colors.ink, ...font(800, 14) },
  name: { color: colors.muted, ...font(600, 11.5) },
});
