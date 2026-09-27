import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Path, Rect } from "react-native-svg";
import { Icon, ScreenHeader, type IconName } from "@/components/ui";
import { PRIVACY_LINKS } from "@/features/onboarding/constants";
import { colors, font } from "@/theme";
import { goBack } from "@/lib/goBack";

/** The design's "Daily card" row icon: two outlined cards (the shared "cards" icon has a filled front card and a sparkle) */
function DeckIcon() {
  return (
    <Svg width={19} height={19} viewBox="0 0 24 24" fill="none" stroke={colors.brand} strokeWidth={2.1} strokeLinejoin="round" strokeLinecap="round">
      <Rect x="4" y="6" width="12" height="15" rx="2.5" transform="rotate(-8 10 13)" />
      <Rect x="9" y="4" width="12" height="15" rx="2.5" transform="rotate(7 15 11)" />
    </Svg>
  );
}

/** The thin "↗" after external links (the DM Sans glyph is small and heavy) */
export function ExternalArrow() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={colors.brand} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M6 18L18 6M9 6h9v9" />
    </Svg>
  );
}

const ROWS: { icon: IconName | "deck"; title: string; body: string }[] = [
  {
    icon: "avCompass",
    title: "The map is the app",
    body: "Rooms, listings and meetups all pinned on real Adelaide streets — distance is the filter.",
  },
  {
    icon: "shield",
    title: "Anonymous by default",
    body: "On the map, others see only your nickname, major and uni. Your email just proves you're a student.",
  },
  {
    icon: "deck",
    title: "Daily card",
    body: "Draw one card a day to meet a random fellow student. You two also see each other's year, pronouns, bio and interests. The deck resets every midnight.",
  },
  {
    icon: "people",
    title: "Walk-in meetups",
    body: "Anyone can host. Hosts and guests stay hidden — you just see a headcount.",
  },
  {
    icon: "houseTab",
    title: "Student flats",
    body: "Rooms listed by verified students, with the real weekly cost (rent + bills), walk time to campus and who already lives there.",
  },
  {
    icon: "tagTab",
    title: "Student marketplace",
    body: "Buy and sell textbooks, tech and furniture. Meet at a safe pickup point or pin your own spot. AI fills in your listing from a photo.",
  },
];

const LINKS = [
  { label: "Privacy & consent", url: PRIVACY_LINKS.app },
  { label: "Safety & reporting (eSafety)", url: PRIVACY_LINKS.esafety },
];

// "More" tab: what UCompass is, plus the privacy and safety links
export default function AboutScreen() {
  return (
    <SafeAreaView edges={["top", "bottom"]} style={styles.screen}>
      <ScreenHeader title="About UCompass" onBack={() => goBack()} />
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
                {r.icon === "deck" ? <DeckIcon /> : <Icon name={r.icon} size={19} color={colors.brand} strokeWidth={2.1} />}
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
              <ExternalArrow />
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
  link: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14 },
  linkDivider: { borderBottomWidth: 2, borderBottomColor: colors.ink },
  linkText: { color: colors.ink, ...font(700, 14) },
  footer: { textAlign: "center", color: colors.faint, ...font(600, 12) },
});
