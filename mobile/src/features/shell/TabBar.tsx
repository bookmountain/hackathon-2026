import type { BottomTabBarProps } from "expo-router/js-tabs";
import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Icon, type IconName } from "@/components/ui";
import { useDailyCardReady } from "@/features/dailycard/useDailyCard";
import { colors, font } from "@/theme";
import { emitTabSwitch } from "./tabSwitch";

const TABS: Record<string, { label: string; icon: IconName }> = {
  meetups: { label: "Meetups", icon: "people" },
  flats: { label: "Flats", icon: "houseTab" },
  market: { label: "Market", icon: "tagTab" },
};

function Slot({ label, icon, color, onPress, selected }: {
  label: string;
  icon: IconName;
  color: string;
  onPress: () => void;
  selected?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityState={{ selected: !!selected }}
      accessibilityLabel={label}
      onPress={onPress}
      style={styles.tab}
    >
      <Icon name={icon} size={24} color={color} strokeWidth={2.1} />
      <Text style={[styles.label, { color }]}>{label}</Text>
    </Pressable>
  );
}

// Bottom navigation from the design: Meetups, Flats, a gap under the yellow
// "Draw card" button, Market and More. Active tab in ink.
export default function TabBar({ state, navigation, insets }: BottomTabBarProps) {
  const drawReady = useDailyCardReady();
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
      <Slot label="More" icon="more" color={colors.faint} onPress={() => router.push("/about")} />

      <View pointerEvents="box-none" style={styles.drawRow}>
        <Pressable
          onPress={() => router.push("/daily-card")}
          accessibilityRole="button"
          accessibilityLabel={drawReady ? "Draw card, today's card is ready" : "Draw card"}
          style={({ pressed }) => [styles.draw, pressed && { backgroundColor: colors.yellowPressed }]}
        >
          <Icon name="cards" size={26} color={colors.ink} strokeWidth={2.1} />
          {drawReady && <View style={styles.badge} />}
        </Pressable>
      </View>
    </View>
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
  drawRow: { position: "absolute", top: -20, left: 0, right: 0, alignItems: "center" },
  draw: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 4,
    borderColor: colors.surface,
    backgroundColor: colors.yellow,
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 6px 16px -3px rgba(244,183,64,0.7)",
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
