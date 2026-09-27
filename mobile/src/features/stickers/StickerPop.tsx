import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { Animated, Easing, StyleSheet, Text, useAnimatedValue, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ToastProvider } from "@/components/feedback/Toast";
import { Sticker } from "@/components/ui";
import { selectSignedIn, useAppStore } from "@/store";
import { colors, font } from "@/theme";
import { celebrates, randomPop, type Pop } from "./pops";

const SHOW_MS = 2450;
const OUT_MS = 350;

const PopContext = createContext<(pop?: Pop) => void>(() => {});

/** Bounce a sticker pop in top-right; a random one when no pop is given. Only once signed in. */
export function useStickerPop() {
  return useContext(PopContext);
}

// Wraps the toasts so celebratory ones ("Room published", "You're in!") bring a pop too
export function StickerPopProvider({ children }: { children: ReactNode }) {
  const { state } = useAppStore();
  const signedIn = useRef(false);
  const isSignedIn = selectSignedIn(state);
  useEffect(() => {
    signedIn.current = isSignedIn;
  }, [isSignedIn]);
  const [pop, setPop] = useState<(Pop & { id: number }) | null>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const show = useCallback((next?: Pop) => {
    if (!signedIn.current) return;
    timers.current.forEach(clearTimeout);
    setPop((prev) => ({ ...(next ?? randomPop()), id: (prev?.id ?? 0) + 1 }));
    timers.current = [setTimeout(() => setPop(null), SHOW_MS + OUT_MS)];
  }, []);

  // Just after the toast, like the design, so a welcome toast lands on the signed-in app
  const onToast = useCallback((text: string) => {
    if (celebrates(text)) timers.current.push(setTimeout(() => show(), 60));
  }, [show]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  return (
    <PopContext.Provider value={show}>
      <ToastProvider onToast={onToast}>
        {children}
        {pop && <PopBubble key={pop.id} pop={pop} />}
      </ToastProvider>
    </PopContext.Provider>
  );
}

function PopBubble({ pop }: { pop: Pop }) {
  const insets = useSafeAreaInsets();
  const inAnim = useAnimatedValue(0);
  const outAnim = useAnimatedValue(0);

  useEffect(() => {
    Animated.sequence([
      Animated.timing(inAnim, { toValue: 1, duration: 650, easing: Easing.linear, useNativeDriver: true }),
      Animated.delay(SHOW_MS - 650),
      Animated.timing(outAnim, { toValue: 1, duration: OUT_MS, easing: Easing.in(Easing.ease), useNativeDriver: true }),
    ]).start();
  }, [inAnim, outAnim]);

  // Overshooting bounce from the design's ucPopIn keyframes, then ucPopOut shrinks it away
  const steps = [0, 0.55, 0.72, 0.86, 1];
  const scaleIn = inAnim.interpolate({ inputRange: steps, outputRange: [0.2, 1.15, 0.94, 1.04, 1] });
  const scaleOut = outAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 0.6] });
  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.pop,
        {
          top: insets.top + 84,
          opacity: Animated.multiply(
            inAnim.interpolate({ inputRange: [0, 0.55, 1], outputRange: [0, 1, 1] }),
            outAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }),
          ),
          transform: [
            { translateY: outAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -10] }) },
            { scale: Animated.multiply(scaleIn, scaleOut) },
            { rotate: inAnim.interpolate({ inputRange: steps, outputRange: ["-25deg", "8deg", "-5deg", "2deg", "0deg"] }) },
          ],
        },
      ]}
    >
      <View style={styles.bubble}>
        <Text style={styles.bubbleText}>{pop.text}</Text>
      </View>
      <Sticker name={pop.sticker} size={64} rotate={8} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  pop: {
    position: "absolute",
    right: 14,
    zIndex: 45,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    transformOrigin: "100% 50%",
  },
  bubble: {
    backgroundColor: colors.surface,
    borderWidth: 2.5,
    borderColor: colors.ink,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    boxShadow: `0 3px 0 ${colors.ink}`,
  },
  bubbleText: { color: colors.ink, ...font(800, 14) },
});
