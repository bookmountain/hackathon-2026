import type { BottomTabBarProps } from "expo-router/js-tabs";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Icon, type IconName } from "@/components/ui";
import { colors, font } from "@/theme";

const TABS: Record<string, { label: string; icon: IconName }> = {
  flats: { label: "Flats", icon: "houseTab" },
  market: { label: "Market", icon: "tagTab" },
  meetups: { label: "Meetups", icon: "people" },
};

// Bottom navigation from the design: three equal tabs, brand blue when active
export default function TabBar({ state, navigation, insets }: BottomTabBarProps) {
  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 12) }]}>
      {state.routes.map((route, index) => {
        const tab = TABS[route.name];
        if (!tab) return null;
        const focused = state.index === index;
        const color = focused ? colors.brand : colors.faint;
        return (
          <Pressable
            key={route.key}
            accessibilityRole="tab"
            accessibilityState={{ selected: focused }}
            onPress={() => {
              const event = navigation.emit({ type: "tabPress", target: route.key, canPreventDefault: true });
              if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
            }}
            style={styles.tab}
          >
            <Icon name={tab.icon} size={24} color={color} strokeWidth={tab.icon === "people" ? 2.1 : undefined} />
            <Text style={[styles.label, { color }]}>{tab.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: "row",
    paddingTop: 8,
    paddingHorizontal: 6,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.lineSoft,
  },
  tab: { flex: 1, alignItems: "center", gap: 4 },
  label: { ...font(700, 11) },
});
