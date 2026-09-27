import { useEffect, type ReactNode } from "react";
import { Animated, Easing, StyleSheet, useAnimatedValue, View } from "react-native";
import { colors, shadows } from "@/theme";

// Sheet docked to the bottom of the map: a pin's card, or search results
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
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 8,
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 2,
    borderBottomWidth: 0,
    borderColor: colors.ink,
    paddingTop: 10,
    paddingHorizontal: 18,
    paddingBottom: 20,
    gap: 14,
    ...shadows.sheet,
  },
  grabber: { alignSelf: "center", width: 36, height: 4, borderRadius: 2, backgroundColor: colors.ink },
});
