import { useEffect, type ReactNode } from "react";
import { Animated, Easing, StyleSheet, useAnimatedValue, View } from "react-native";
import { colors, shadows } from "@/theme";

// Card that slides up over the bottom of the map when a pin is tapped
export default function MapSheet({ children }: { children: ReactNode }) {
  const enter = useAnimatedValue(0);

  useEffect(() => {
    Animated.timing(enter, { toValue: 1, duration: 280, easing: Easing.out(Easing.ease), useNativeDriver: true }).start();
  }, [enter]);

  return (
    <Animated.View
      style={[
        styles.sheet,
        {
          opacity: enter,
          transform: [{ translateY: enter.interpolate({ inputRange: [0, 1], outputRange: [40, 0] }) }],
        },
      ]}
    >
      <View style={styles.grabber} />
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  sheet: {
    position: "absolute",
    left: 10,
    right: 10,
    bottom: 10,
    zIndex: 8,
    backgroundColor: colors.surface,
    borderRadius: 26,
    paddingTop: 10,
    paddingHorizontal: 18,
    paddingBottom: 18,
    gap: 14,
    ...shadows.sheet,
  },
  grabber: { alignSelf: "center", width: 40, height: 5, borderRadius: 3, backgroundColor: colors.line },
});
