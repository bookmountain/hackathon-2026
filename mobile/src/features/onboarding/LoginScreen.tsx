import { LinearGradient } from "expo-linear-gradient";
import { router, useFocusEffect } from "expo-router";
import { setStatusBarStyle } from "expo-status-bar";
import { useCallback } from "react";
import { Image, Pressable, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Icon, Logo } from "@/components/ui";
import { brutal, colors, font } from "@/theme";

const BACKGROUND = "https://images.unsplash.com/photo-1528605248644-14dd04022da1?w=800&h=1200&q=75&auto=format&fit=crop";

/** Polaroids laid out on the design's 390pt-wide phone; scaled to the screen */
const POLAROIDS = [
  { caption: "study sesh", left: 18, top: 40, width: 176, photo: 150, rotate: -7, id: "photo-1543269865-cbf427effbad" },
  { caption: "o-week party", left: 190, top: 20, width: 168, photo: 130, rotate: 6, id: "photo-1492684223066-81342ee5ff30" },
  { caption: "new flatmates", left: 112, top: 215, width: 190, photo: 140, rotate: -2, id: "photo-1511632765486-a01980e01a18" },
];

const STICKERS = [
  { label: "Adelaide Uni", left: 24, top: 238, rotate: -10, bg: colors.yellow, fg: colors.ink },
  { label: "Flinders", left: 262, top: 196, rotate: 8, bg: colors.surface, fg: colors.brand },
  { label: "Pizza night · Fri", left: 262, top: 372, rotate: -6, bg: colors.coral, fg: colors.surface },
];

const DESIGN_WIDTH = 390;

const photoUrl = (id: string, w: number, h: number) =>
  `https://images.unsplash.com/${id}?w=${w * 2}&h=${h * 2}&q=75&auto=format&fit=crop`;

// Landing: a collage of student life, then "Sign in with uni email"
export default function LoginScreen() {
  const { width } = useWindowDimensions();
  const s = Math.min(width / DESIGN_WIDTH, 1.2);
  // White status bar over the photo only while this screen shows; it stays mounted under the email screen
  useFocusEffect(
    useCallback(() => {
      setStatusBarStyle("light");
      return () => setStatusBarStyle("dark");
    }, []),
  );

  return (
    <View style={styles.screen}>
      <Image source={{ uri: BACKGROUND }} style={styles.background} resizeMode="cover" accessibilityIgnoresInvertColors />
      <LinearGradient
        colors={["rgba(20,20,43,0.35)", "rgba(20,20,43,0.1)", "rgba(46,90,168,0.85)", colors.brand]}
        locations={[0, 0.3, 0.62, 0.78]}
        style={StyleSheet.absoluteFill}
      />
      <SafeAreaView style={styles.flex} edges={["top", "bottom"]}>
        <View style={[styles.collage, { height: 430 * s }]} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          {POLAROIDS.map((p, i) => (
            <View
              key={p.caption}
              style={[
                styles.polaroid,
                { left: p.left * s, top: p.top * s, width: p.width * s, zIndex: 2 + i, transform: [{ rotate: `${p.rotate}deg` }] },
              ]}
            >
              <Image
                source={{ uri: photoUrl(p.id, p.width, p.photo) }}
                style={[styles.polaroidPhoto, { height: p.photo * s }]}
                resizeMode="cover"
              />
              <Text style={styles.caption}>{p.caption}</Text>
            </View>
          ))}
          {STICKERS.map((st) => (
            <View
              key={st.label}
              style={[
                styles.sticker,
                { left: st.left * s, top: st.top * s, backgroundColor: st.bg, transform: [{ rotate: `${st.rotate}deg` }] },
              ]}
            >
              <Text style={[styles.stickerText, { color: st.fg }]}>{st.label}</Text>
            </View>
          ))}
        </View>

        <View style={styles.bottom}>
          <View style={styles.brandBlock}>
            <View style={styles.brandRow}>
              <Logo size={36} variant="onBrand" />
              <Text style={styles.brandName}>UCompass</Text>
            </View>
            <Text style={styles.headline} accessibilityRole="header">
              {"Find your\npeople\n"}
              <Text style={{ color: colors.yellow }}>Find your place</Text>
            </Text>
          </View>
          <View style={styles.actions}>
            <Pressable
              onPress={() => router.push("/email")}
              accessibilityRole="button"
              style={({ pressed }) => [styles.signIn, pressed && { backgroundColor: colors.brandSoft }]}
            >
              <Icon name="gradCap" size={20} color={colors.brand} strokeWidth={2.3} />
              <Text style={styles.signInText}>Sign in with uni email</Text>
            </Pressable>
            <Text style={styles.onlyStudents}>Adelaide Uni & Flinders students only</Text>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.ink },
  background: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0, opacity: 0.55 },
  flex: { flex: 1 },
  collage: { width: "100%" },
  polaroid: {
    position: "absolute",
    backgroundColor: colors.surface,
    paddingTop: 7,
    paddingHorizontal: 7,
    borderRadius: 6,
    boxShadow: "0 14px 30px -8px rgba(0,0,0,0.55)",
  },
  polaroidPhoto: { width: "100%", borderRadius: 3, backgroundColor: colors.brandSofter },
  caption: { height: 30, lineHeight: 30, textAlign: "center", color: colors.ink, ...font(800, 13) },
  sticker: {
    position: "absolute",
    zIndex: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    boxShadow: "0 6px 14px rgba(0,0,0,0.3)",
  },
  stickerText: { ...font(800, 13) },
  bottom: { flex: 1, justifyContent: "flex-end", paddingHorizontal: 24, paddingBottom: 20, gap: 22 },
  brandBlock: { gap: 12 },
  brandRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  brandName: { color: colors.surface, ...font(800, 20, undefined, -0.01) },
  headline: {
    color: colors.surface,
    ...font(800, 44, 1.02, -0.035),
    textShadowColor: "rgba(20,20,43,0.35)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 20,
  },
  actions: { gap: 12 },
  signIn: {
    height: 56,
    borderRadius: 18,
    backgroundColor: colors.surface,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    ...brutal(0),
    boxShadow: "0 14px 30px -10px rgba(20,20,43,0.5)",
  },
  signInText: { color: colors.brand, ...font(800, 16.5) },
  onlyStudents: { color: colors.surface, textAlign: "center", ...font(600, 12.5) },
});
