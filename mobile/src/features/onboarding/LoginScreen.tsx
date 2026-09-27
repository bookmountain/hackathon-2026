import { LinearGradient } from "expo-linear-gradient";
import { router, useFocusEffect } from "expo-router";
import { setStatusBarStyle } from "expo-status-bar";
import { useCallback } from "react";
import { Image, StyleSheet, Text, useWindowDimensions, View, type ImageSourcePropType } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Circle, Defs, Ellipse, G, LinearGradient as SvgLinearGradient, Path, Polygon, RadialGradient, Rect, Stop } from "react-native-svg";
import { GamePressable, Icon, Logo } from "@/components/ui";
import { colors, font } from "@/theme";

/** Polaroids laid out on the design's 390pt-wide phone; scaled to the screen */
const POLAROIDS: { caption: string; left: number; top: number; width: number; photo: number; rotate: number; source: ImageSourcePropType }[] = [
  { caption: "arvo study sesh", left: 18, top: 40, width: 176, photo: 150, rotate: -7, source: require("../../../assets/images/login-flinders-students.jpg") },
  { caption: "o-week party", left: 190, top: 20, width: 168, photo: 130, rotate: 6, source: require("../../../assets/images/login-adelaide-group.jpg") },
  { caption: "new flatmates", left: 112, top: 215, width: 190, photo: 140, rotate: -2, source: require("../../../assets/images/login-flinders-lounge.jpg") },
];

const STICKERS = [
  { label: "Adelaide Uni", left: 24, top: 238, rotate: -10, bg: colors.yellow, fg: colors.ink },
  { label: "Flinders", left: 262, top: 196, rotate: 8, bg: colors.surface, fg: colors.brand },
  { label: "Sausage sizzle · Fri", left: 196, top: 404, rotate: -6, bg: colors.coral, fg: colors.surface },
];

const DESIGN_WIDTH = 390;

// The design's illustrated campus at sunset: sky, sun, clouds, sparkles, buildings, lawn and two students.
// Drawn on a 390x500 canvas that covers the screen, anchored to the bottom (xMidYMax slice).
function SunsetCampus() {
  return (
    <Svg width="100%" height="100%" viewBox="0 0 390 500" preserveAspectRatio="xMidYMax slice">
      <Defs>
        <SvgLinearGradient id="anSky" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#FFD9A8" />
          <Stop offset="0.38" stopColor="#FFB1C9" />
          <Stop offset="0.7" stopColor="#B79CE8" />
          <Stop offset="1" stopColor="#6D6BC9" />
        </SvgLinearGradient>
        <RadialGradient id="anSun" cx="50%" cy="50%" r="50%">
          <Stop offset="0" stopColor="#FFF7E2" />
          <Stop offset="0.6" stopColor="#FFE39C" />
          <Stop offset="1" stopColor="#FFE39C" stopOpacity="0" />
        </RadialGradient>
      </Defs>
      <Rect width="390" height="500" fill="url(#anSky)" />
      <Circle cx="290" cy="150" r="120" fill="url(#anSun)" opacity={0.85} />
      <Circle cx="290" cy="150" r="46" fill="#FFF3D0" />
      <G fill="#fff" opacity={0.85}>
        <Ellipse cx="70" cy="96" rx="34" ry="15" />
        <Ellipse cx="92" cy="88" rx="24" ry="13" />
        <Ellipse cx="320" cy="72" rx="30" ry="13" />
        <Ellipse cx="300" cy="66" rx="20" ry="11" />
      </G>
      <G fill="#fff" opacity={0.7}>
        <Circle cx="40" cy="180" r="2.4" />
        <Circle cx="150" cy="120" r="1.8" />
        <Circle cx="350" cy="210" r="2.2" />
        <Circle cx="250" cy="250" r="1.6" />
        <Circle cx="110" cy="230" r="2" />
      </G>
      <G opacity={0.92}>
        <Rect x="150" y="250" width="150" height="130" fill="#4A4E82" />
        <Polygon points="150,250 225,214 300,250" fill="#3A3D68" />
        <Rect x="168" y="272" width="18" height="24" rx="2" fill="#FFE39C" />
        <Rect x="198" y="272" width="18" height="24" rx="2" fill="#FFE39C" />
        <Rect x="228" y="272" width="18" height="24" rx="2" fill="#FFE39C" />
        <Rect x="258" y="272" width="18" height="24" rx="2" fill="#FFE39C" />
        <Rect x="168" y="312" width="18" height="24" rx="2" fill="#FFD37A" />
        <Rect x="258" y="312" width="18" height="24" rx="2" fill="#FFD37A" />
        <Rect x="210" y="330" width="30" height="50" rx="3" fill="#2E3157" />
        <Rect x="218" y="228" width="4" height="24" fill="#3A3D68" />
        <Path d="M220 228l14 6-14 5z" fill="#FF8FB0" />
      </G>
      <G opacity={0.9}>
        <Rect x="20" y="300" width="70" height="80" fill="#565A93" />
        <Rect x="30" y="316" width="12" height="16" fill="#FFE39C" />
        <Rect x="50" y="316" width="12" height="16" fill="#FFE39C" />
        <Rect x="70" y="316" width="12" height="16" fill="#FFE39C" />
        <Rect x="30" y="344" width="12" height="16" fill="#FFD37A" />
        <Rect x="70" y="344" width="12" height="16" fill="#FFD37A" />
      </G>
      <Path d="M0 384 Q195 366 390 384 L390 500 L0 500 Z" fill="#7FB98A" />
      <Path d="M0 402 Q195 388 390 402 L390 500 L0 500 Z" fill="#6BA878" />
      <Path
        d="M338 150 q-22 -30 -52 -24 q28 -14 52 12 q4 -30 30 -34 q-18 22 -8 44 q22 -6 34 10 q-30 2 -40 22 q-6 -22 -16 -30z"
        fill="#FFC2DA"
      />
      <G fill="#FFD3E4">
        <Circle cx="330" cy="120" r="6" />
        <Circle cx="356" cy="140" r="5" />
        <Circle cx="318" cy="150" r="5" />
      </G>
      <G fill="#FFB7D2" opacity={0.9}>
        <Circle cx="60" cy="150" r="3" />
        <Circle cx="120" cy="300" r="2.6" />
        <Circle cx="300" cy="330" r="3" />
        <Circle cx="180" cy="200" r="2.4" />
        <Circle cx="40" cy="260" r="2.6" />
        <Circle cx="350" cy="290" r="2.6" />
        <Path d="M90 210 l2 4 4 1 -3 3 1 4 -4 -2 -4 2 1 -4 -3 -3 4 -1z" />
      </G>
      <G transform="translate(150 372)">
        <Ellipse cx="10" cy="34" rx="13" ry="4" fill="#3A6B4A" opacity={0.4} />
        <Rect x="2" y="12" width="16" height="20" rx="6" fill="#FF8DA6" />
        <Rect x="4" y="30" width="5" height="10" fill="#3A3D68" />
        <Rect x="11" y="30" width="5" height="10" fill="#3A3D68" />
        <Circle cx="10" cy="5" r="7" fill="#FFE0C2" />
        <Path d="M3 4 a7 7 0 0 1 14 0 q-7 -5 -14 0z" fill="#5A4632" />
      </G>
      <G transform="translate(210 366)">
        <Ellipse cx="10" cy="40" rx="14" ry="4" fill="#3A6B4A" opacity={0.4} />
        <Rect x="2" y="14" width="17" height="24" rx="6" fill="#6FA8FF" />
        <Rect x="4" y="36" width="5" height="10" fill="#2E3157" />
        <Rect x="12" y="36" width="5" height="10" fill="#2E3157" />
        <Circle cx="10" cy="6" r="7.5" fill="#FBD3B4" />
        <Path d="M2.5 6 a7.5 7.5 0 0 1 15 0 q-4 -7 -15 -1z" fill="#2B2B2B" />
      </G>
    </Svg>
  );
}

// Landing: a collage of student life over a sunset campus, then "Sign in with uni email"
export default function LoginScreen() {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const s = Math.min(width / DESIGN_WIDTH, 1.2);
  // White status bar on the ink strip only while this screen shows; it stays mounted under the email screen
  useFocusEffect(
    useCallback(() => {
      setStatusBarStyle("light");
      return () => setStatusBarStyle("dark");
    }, []),
  );

  return (
    <View style={styles.screen}>
      {/* The design keeps an ink status bar strip; the scene starts below it */}
      <View style={[styles.scene, { top: insets.top }]}>
        <View style={StyleSheet.absoluteFill} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          <SunsetCampus />
        </View>
        <LinearGradient
          colors={["rgba(20,20,43,0.28)", "rgba(20,20,43,0.06)", "rgba(46,90,168,0.82)", colors.brand]}
          locations={[0, 0.26, 0.64, 0.8]}
          style={StyleSheet.absoluteFill}
        />
        <View style={[styles.collage, { height: 430 * s }]} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          {POLAROIDS.map((p, i) => (
            <View
              key={p.caption}
              style={[
                styles.polaroid,
                { left: p.left * s, top: p.top * s, width: p.width * s, zIndex: 2 + i, transform: [{ rotate: `${p.rotate}deg` }] },
              ]}
            >
              <Image source={p.source} style={[styles.polaroidPhoto, { height: p.photo * s }]} resizeMode="cover" />
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
              <Text style={[styles.stickerText, { color: st.fg }]} numberOfLines={1}>
                {st.label}
              </Text>
            </View>
          ))}
          <View style={[styles.gday, { left: 36 * s, top: 394 * s }]}>
            <Text style={styles.gdayText}>{"G'day!"}</Text>
          </View>
        </View>

        <View style={[styles.bottom, { paddingBottom: Math.max(34, insets.bottom) }]}>
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
            <GamePressable
              kind="cta"
              onPress={() => router.push("/email")}
              accessibilityRole="button"
              faceStyle={(pressed) => [styles.signIn, pressed && { backgroundColor: colors.brandSoft }]}
            >
              <Icon name="gradCap" size={20} color={colors.brand} strokeWidth={2.3} />
              <Text style={styles.signInText}>Sign in with uni email</Text>
            </GamePressable>
            <Text style={styles.onlyStudents}>Adelaide Uni & Flinders students only</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.ink },
  scene: { position: "absolute", left: 0, right: 0, bottom: 0, overflow: "hidden" },
  collage: { position: "absolute", left: 0, right: 0, top: 0 },
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
  // Chunkier square-ish tag with a white edge, above the pills
  gday: {
    position: "absolute",
    zIndex: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 14,
    borderWidth: 3,
    borderColor: colors.surface,
    backgroundColor: colors.yellow,
    transform: [{ rotate: "-12deg" }],
    boxShadow: "0 6px 14px rgba(0,0,0,0.35)",
  },
  gdayText: { color: colors.ink, ...font(800, 15) },
  bottom: { position: "absolute", left: 0, right: 0, bottom: 0, paddingHorizontal: 24, gap: 22 },
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
  },
  signInText: { color: colors.brand, ...font(800, 16.5) },
  onlyStudents: { color: colors.surface, textAlign: "center", ...font(600, 12.5) },
});
