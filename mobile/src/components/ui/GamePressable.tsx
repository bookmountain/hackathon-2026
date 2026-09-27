import { useState, type ReactNode } from "react";
import {
  Animated,
  Pressable,
  StyleSheet,
  useAnimatedValue,
  type LayoutRectangle,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { colors } from "@/theme";

/**
 * The v6 design's "game" button looks:
 * - cta: big buttons, 2.5px ink border, 6px ink ledge, glossy top half
 * - sm: small buttons and chips, 3px ledge, glossy
 * - card: tappable list cards, 5px ledge
 * - row: list rows that keep their own border, 3px ledge
 * - round: circular icon buttons, 3px ledge, squash on press
 */
export type GameKind = "cta" | "sm" | "card" | "row" | "round";

const KINDS: Record<GameKind, { ledge: number; press: number; pressedLedge: number; border: boolean; gloss: boolean }> = {
  cta: { ledge: 6, press: 4, pressedLedge: 0, border: true, gloss: true },
  sm: { ledge: 3, press: 3, pressedLedge: 0, border: true, gloss: true },
  card: { ledge: 5, press: 3, pressedLedge: 1, border: true, gloss: false },
  row: { ledge: 3, press: 3, pressedLedge: 0, border: false, gloss: false },
  round: { ledge: 3, press: 3, pressedLedge: 0, border: true, gloss: false },
};

const GLOSS = ["rgba(255,255,255,0.34)", "rgba(255,255,255,0.12)", "rgba(255,255,255,0)", "rgba(255,255,255,0)"] as const;
const GLOSS_STOPS = [0, 0.5, 0.5, 1] as const;

type Props = Omit<PressableProps, "style" | "children"> & {
  kind: GameKind;
  /** Layout of the whole button (flex, margins, alignSelf) */
  style?: StyleProp<ViewStyle>;
  /** Look of the face: background, radius, padding, size. Can depend on pressed. */
  faceStyle?: StyleProp<ViewStyle> | ((pressed: boolean) => StyleProp<ViewStyle>);
  children: ReactNode;
};

// The face sits on an ink ledge and sinks onto it while pressed, then springs back
export default function GamePressable({ kind, style, faceStyle, children, onPressIn, onPressOut, ...rest }: Props) {
  const k = KINDS[kind];
  const [pressed, setPressed] = useState(false);
  // The ledge sits exactly under the face, which can be narrower than the Pressable
  // (e.g. a 40pt round button in a stretched column)
  const [box, setBox] = useState<LayoutRectangle | null>(null);
  const p = useAnimatedValue(0);
  const face = typeof faceStyle === "function" ? faceStyle(pressed) : faceStyle;
  const radius = StyleSheet.flatten(face)?.borderRadius ?? 0;

  const faceShift = p.interpolate({ inputRange: [0, 1], outputRange: [0, k.press] });
  const ledgeShift = p.interpolate({ inputRange: [0, 1], outputRange: [k.ledge, k.press + k.pressedLedge] });
  const transform: ViewStyle["transform"] =
    kind === "round"
      ? [
          { translateY: faceShift },
          { scaleX: p.interpolate({ inputRange: [0, 1], outputRange: [1, 1.12] }) },
          { scaleY: p.interpolate({ inputRange: [0, 1], outputRange: [1, 0.86] }) },
        ]
      : [{ translateY: faceShift }];

  return (
    <Pressable
      {...rest}
      style={style}
      onPressIn={(e) => {
        setPressed(true);
        Animated.timing(p, { toValue: 1, duration: 60, useNativeDriver: true }).start();
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        setPressed(false);
        Animated.spring(p, { toValue: 0, speed: 18, bounciness: 12, useNativeDriver: true }).start();
        onPressOut?.(e);
      }}
    >
      {box && (
        <Animated.View
          style={[
            styles.ledge,
            { left: box.x, top: box.y, width: box.width, height: box.height, borderRadius: radius },
            { transform: [{ translateY: ledgeShift }] },
          ]}
        />
      )}
      <Animated.View
        onLayout={(e) => setBox(e.nativeEvent.layout)}
        style={[face, k.border && styles.border, k.gloss && styles.clip, { transform }]}
      >
        {k.gloss && (
          <LinearGradient pointerEvents="none" colors={GLOSS} locations={GLOSS_STOPS} style={StyleSheet.absoluteFill} />
        )}
        {children}
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  ledge: { position: "absolute", backgroundColor: colors.ink },
  border: { borderWidth: 2.5, borderColor: colors.ink },
  clip: { overflow: "hidden" },
});
