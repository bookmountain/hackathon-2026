import { useEffect } from "react";
import { Animated, Easing, StyleSheet, Text, useAnimatedValue, View } from "react-native";
import { colors, font } from "@/theme";
import MapMarker from "./MapMarker";
import { YOU } from "./geometry";

const DOT = 22;

// Yellow "You" dot with a pulsing halo and a label to the lower right
export default function YouMarker() {
  const pulse = useAnimatedValue(0);

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(pulse, { toValue: 1, duration: 2000, easing: Easing.out(Easing.ease), useNativeDriver: true }),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  return (
    <MapMarker x={YOU.x} y={YOU.y} zIndex={5}>
      <View pointerEvents="none" style={styles.box}>
        <Animated.View
          style={[
            styles.halo,
            {
              opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.7, 0] }),
              transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.6, 2.4] }) }],
            },
          ]}
        />
        <View style={styles.dot} />
        <View style={styles.labelBox}>
          <Text style={styles.label}>You</Text>
        </View>
      </View>
    </MapMarker>
  );
}

const styles = StyleSheet.create({
  box: { width: DOT, height: DOT, overflow: "visible" },
  halo: { ...StyleSheet.absoluteFill, borderRadius: DOT / 2, backgroundColor: colors.yellow },
  dot: {
    ...StyleSheet.absoluteFill,
    borderRadius: DOT / 2,
    backgroundColor: colors.yellow,
    borderWidth: 4,
    borderColor: colors.surface,
    shadowColor: colors.ink,
    shadowOpacity: 0.35,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  // Design: label at (192, 340) while the dot is centred on (180, 330).
  // The wrapper gives the text room; otherwise it inherits the dot's 22px width.
  labelBox: { position: "absolute", left: DOT / 2 + 12, top: DOT / 2 + 10, width: 60, alignItems: "flex-start" },
  label: {
    backgroundColor: colors.surface,
    color: colors.ink,
    borderRadius: 6,
    overflow: "hidden",
    paddingHorizontal: 7,
    paddingVertical: 2,
    ...font(800, 10),
  },
});
