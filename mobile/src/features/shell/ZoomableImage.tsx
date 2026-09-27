import { useEffect } from "react";
import { StyleSheet } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";

const MAX_SCALE = 4;
const DOUBLE_TAP_SCALE = 2.5;

type Props = {
  uri: string;
  width: number;
  height: number;
  /** Off-screen pages zoom back out */
  active: boolean;
  /** True while zoomed in, so the pager can stop swiping and the pan can move the photo */
  onZoomChange: (zoomed: boolean) => void;
  zoomed: boolean;
  accessibilityLabel?: string;
};

// A photo you can pinch or double-tap to zoom, and drag around while zoomed
export default function ZoomableImage({ uri, width, height, active, onZoomChange, zoomed, accessibilityLabel }: Props) {
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const x = useSharedValue(0);
  const y = useSharedValue(0);
  const savedX = useSharedValue(0);
  const savedY = useSharedValue(0);

  useEffect(() => {
    if (active) return;
    scale.set(1);
    savedScale.set(1);
    x.set(0);
    y.set(0);
    savedX.set(0);
    savedY.set(0);
  }, [active, scale, savedScale, x, y, savedX, savedY]);

  // Keep the photo covering its frame: it can move at most the overflow on each side
  const clampX = (v: number, s: number) => {
    "worklet";
    const max = (width * (s - 1)) / 2;
    return Math.min(max, Math.max(-max, v));
  };
  const clampY = (v: number, s: number) => {
    "worklet";
    const max = (height * (s - 1)) / 2;
    return Math.min(max, Math.max(-max, v));
  };

  const settle = (to: number) => {
    "worklet";
    const next = to < 1.05 ? 1 : Math.min(to, MAX_SCALE);
    scale.set(withTiming(next));
    savedScale.set(next);
    const nx = next === 1 ? 0 : clampX(x.get(), next);
    const ny = next === 1 ? 0 : clampY(y.get(), next);
    x.set(withTiming(nx));
    y.set(withTiming(ny));
    savedX.set(nx);
    savedY.set(ny);
    scheduleOnRN(onZoomChange, next > 1);
  };

  const pinch = Gesture.Pinch()
    .onUpdate((e) => {
      scale.set(Math.min(MAX_SCALE * 1.2, Math.max(0.8, savedScale.get() * e.scale)));
    })
    .onEnd(() => settle(scale.get()));

  // Only while zoomed; otherwise the swipe goes to the pager
  const pan = Gesture.Pan()
    .enabled(zoomed)
    .averageTouches(true)
    .onUpdate((e) => {
      x.set(clampX(savedX.get() + e.translationX, scale.get()));
      y.set(clampY(savedY.get() + e.translationY, scale.get()));
    })
    .onEnd(() => {
      savedX.set(x.get());
      savedY.set(y.get());
    });

  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => settle(savedScale.get() > 1 ? 1 : DOUBLE_TAP_SCALE));

  const style = useAnimatedStyle(() => ({
    transform: [{ translateX: x.get() }, { translateY: y.get() }, { scale: scale.get() }],
  }));

  return (
    <GestureDetector gesture={Gesture.Simultaneous(pinch, pan, doubleTap)}>
      <Animated.View style={{ width, height, overflow: "hidden" }}>
        <Animated.Image
          source={{ uri }}
          style={[StyleSheet.absoluteFill, style]}
          resizeMode="contain"
          accessibilityLabel={accessibilityLabel}
          accessibilityIgnoresInvertColors
        />
      </Animated.View>
    </GestureDetector>
  );
}
