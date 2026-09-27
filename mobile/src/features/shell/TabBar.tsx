import type { BottomTabBarProps } from "expo-router/js-tabs";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Animated, Easing, Pressable, StyleSheet, Text, useAnimatedValue, View } from "react-native";
import { Icon, type IconName } from "@/components/ui";
import { useDailyCardReady } from "@/features/dailycard/useDailyCard";
import { TAB_POPS } from "@/features/stickers/pops";
import { selectHasUnread, useAppStore } from "@/store";
import { useStickerPop } from "@/features/stickers/StickerPop";
import { colors, font } from "@/theme";
import { emitTabSwitch } from "./tabSwitch";

const TABS: Record<string, { label: string; icon: IconName }> = {
  meetups: { label: "Meetups", icon: "people" },
  flats: { label: "Flats", icon: "houseTab" },
  market: { label: "Market", icon: "tagTab" },
};

function Slot({ label, icon, color, onPress, selected, dot }: {
  label: string;
  icon: IconName;
  color: string;
  onPress: () => void;
  selected?: boolean;
  /** Yellow dot on the icon, e.g. unread messages */
  dot?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityState={{ selected: !!selected }}
      accessibilityLabel={dot ? `${label}, unread` : label}
      onPress={onPress}
      style={styles.tab}
    >
      <View>
        <Icon name={icon} size={24} color={color} strokeWidth={2.1} />
        {dot && <View style={styles.unread} />}
      </View>
      <Text style={[styles.label, { color }]}>{label}</Text>
    </Pressable>
  );
}

// Bottom navigation from the design: Meetups, Flats, a gap under the yellow
// "Draw card" button, Market and Messages. Active tab in ink.
export default function TabBar({ state, navigation, insets }: BottomTabBarProps) {
  const { state: app } = useAppStore();
  const hasUnread = selectHasUnread(app);
  const drawReady = useDailyCardReady();
  const pop = useStickerPop();
  const tabs = state.routes.flatMap((route, index) => {
    const tab = TABS[route.name];
    if (!tab) return [];
    const focused = state.index === index;
    return [
      <Slot
        key={route.key}
        {...tab}
        selected={focused}
        color={focused ? colors.ink : colors.faint}
        onPress={() => {
          const event = navigation.emit({ type: "tabPress", target: route.key, canPreventDefault: true });
          if (!focused && !event.defaultPrevented) {
            emitTabSwitch();
            navigation.navigate(route.name);
            if (TAB_POPS[route.name]) pop(TAB_POPS[route.name]);
          }
        }}
      />,
    ];
  });

  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 12) }]}>
      {tabs.slice(0, 2)}
      <View style={styles.tab} />
      {tabs.slice(2)}
      <Slot label="Messages" icon="chat" color={colors.faint} dot={hasUnread} onPress={() => router.push("/chats")} />

      <View pointerEvents="box-none" style={styles.drawRow}>
        <DrawButton ready={drawReady} />
      </View>
    </View>
  );
}

// Every 3s: still for most of it, then a quick shake (the design's ucWiggle)
const WIGGLE = { input: [0, 0.76, 0.8, 0.84, 0.88, 0.92, 0.96, 1], rotate: [0, 0, -14, 11, -8, 5, -2, 0] };

// Yellow "Draw card" button: ink-bordered, in a white ring, on an ink ledge it sinks into
function DrawButton({ ready }: { ready: boolean }) {
  const [pressed, setPressed] = useState(false);
  const wiggle = useAnimatedValue(0);

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(wiggle, { toValue: 1, duration: 3000, easing: Easing.linear, useNativeDriver: true }),
    );
    loop.start();
    return () => loop.stop();
  }, [wiggle]);

  const rotate = wiggle.interpolate({ inputRange: WIGGLE.input, outputRange: WIGGLE.rotate.map((d) => `${d}deg`) });
  const scale = wiggle.interpolate({ inputRange: [0, 0.76, 0.8, 0.84, 0.88, 1], outputRange: [1, 1, 1.06, 1.06, 1, 1] });
  return (
    <Animated.View style={{ transform: [{ rotate }, { scale }] }}>
      <View style={[styles.drawLedge, { top: pressed ? 4 : 6 }]} />
      <Pressable
        onPress={() => router.push("/daily-card")}
        onPressIn={() => setPressed(true)}
        onPressOut={() => setPressed(false)}
        accessibilityRole="button"
        accessibilityLabel={ready ? "Draw card, today's card is ready" : "Draw card"}
        style={[styles.drawRing, pressed && { transform: [{ translateY: 4 }] }]}
      >
        <View style={[styles.draw, pressed && { backgroundColor: colors.yellowPressed }]}>
          <Icon name="cards" size={26} color={colors.ink} strokeWidth={2.1} />
          {ready && <View style={styles.badge} />}
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 10,
    paddingHorizontal: 4,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.tabLine,
  },
  tab: { flex: 1, alignItems: "center", gap: 5 },
  label: { ...font(600, 11) },
  drawRow: { position: "absolute", top: -24, left: 0, right: 0, alignItems: "center" },
  drawLedge: { position: "absolute", left: 0, width: 64, height: 64, borderRadius: 32, backgroundColor: colors.ink },
  drawRing: { width: 64, height: 64, borderRadius: 32, padding: 4, backgroundColor: colors.surface },
  draw: {
    flex: 1,
    borderRadius: 28,
    borderWidth: 3,
    borderColor: colors.ink,
    backgroundColor: colors.yellow,
    alignItems: "center",
    justifyContent: "center",
  },
  unread: {
    position: "absolute",
    top: -2,
    right: -3,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.yellow,
    borderWidth: 2,
    borderColor: colors.surface,
  },
  badge: {
    position: "absolute",
    top: -1,
    right: -1,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: colors.coral,
    borderWidth: 2.5,
    borderColor: colors.surface,
  },
});
