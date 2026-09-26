import { router } from "expo-router";
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Icon, ScreenHeader, type IconName } from "@/components/ui";
import { PRIVACY_LINKS } from "@/features/onboarding/constants";
import { colors, font } from "@/theme";

const ROWS: { icon: IconName; title: string; body: string }[] = [
  {
    icon: "avCompass",
    title: "The map is the app",
    body: "Rooms, listings and meetups all pinned on real Adelaide streets — distance is the filter.",
  },
  {
    icon: "shield",
    title: "Anonymous by default",
    body: "Others see only your nickname, major and uni. Your email just proves you're a student.",
  },
  {
    icon: "cards",
    title: "Daily card",
    body: "Draw one card a day to meet a random fellow student. The deck resets every midnight.",
  },
  {
    icon: "people",
    title: "Walk-in meetups",
    body: "Anyone can host. Hosts and guests stay hidden — you just see a headcount.",
  },
];

const LINKS = [
  { label: "Privacy & consent (APP)", url: PRIVACY_LINKS.app },
  { label: "Safety & reporting (eSafety)", url: PRIVACY_LINKS.esafety },
];

// "More" tab: what UCompass is, plus the privacy and safety links
export default function AboutScreen() {
  return (
    <SafeAreaView edges={["top", "bottom"]} style={styles.screen}>
      <ScreenHeader title="About UCompass" onBack={() => router.back()} />
      <ScrollView contentContainerStyle={styles.body}>
        <View style={styles.hero}>
          <Text style={styles.heroTitle}>Your campus, on one map</Text>
          <Text style={styles.heroBody}>
            Flatmates, marketplace and meetups for Adelaide Uni & Flinders students — every feature lives on a real
            map of the CBD. Verified by uni email, shown only as a nickname.
          </Text>
        </View>

        <View style={styles.rows}>
          {ROWS.map((r) => (
            <View key={r.title} style={styles.row}>
              <View style={styles.rowIcon}>
                <Icon name={r.icon} size={19} color={colors.brand} strokeWidth={2.2} />
              </View>
              <View style={styles.rowText}>
                <Text style={styles.rowTitle}>{r.title}</Text>
                <Text style={styles.rowBody}>{r.body}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.links}>
          {LINKS.map((l, i) => (
            <Pressable
              key={l.url}
              onPress={() => Linking.openURL(l.url)}
              accessibilityRole="link"
              style={[styles.link, i < LINKS.length - 1 && styles.linkDivider]}
            >
              <Text style={styles.linkText}>{l.label}</Text>
              <Text style={styles.linkIcon}>↗</Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.footer}>UCompass · student demo · Adelaide 2026</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surface },
  body: { padding: 20, gap: 18 },
  hero: { backgroundColor: colors.ink, borderRadius: 20, padding: 18, gap: 8 },
  heroTitle: { color: colors.surface, ...font(800, 22, 1.15) },
  heroBody: { color: colors.brandLight, ...font(500, 14, 1.5) },
  rows: { gap: 10 },
  row: { flexDirection: "row", gap: 12, alignItems: "flex-start" },
  rowIcon: {
    width: 38,
    height: 38,
    borderRadius: 11,
    backgroundColor: colors.brandSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  rowText: { flex: 1, gap: 2 },
  rowTitle: { color: colors.ink, ...font(800, 14.5) },
  rowBody: { color: colors.muted, ...font(500, 13, 1.45) },
  links: { borderWidth: 2, borderColor: colors.ink, borderRadius: 16 },
  link: { flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 14 },
  linkDivider: { borderBottomWidth: 2, borderBottomColor: colors.ink },
  linkText: { color: colors.ink, ...font(700, 14) },
  linkIcon: { color: colors.brand, ...font(700, 14) },
  footer: { textAlign: "center", color: colors.faint, ...font(600, 12) },
});
