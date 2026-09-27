import { StyleSheet, Text, View } from "react-native";
import { GamePressable, Icon, Segmented } from "@/components/ui";
import { colors, divider, font } from "@/theme";

export type TabView = "map" | "list";

type Props = {
  view: TabView;
  onViewChange: (view: TabView) => void;
  /** Blue action on the right: "List a room", "Sell", "Host" */
  action: { label: string; onPress: () => void };
};

// Map/List toggle and the tab's main action
export default function ViewToolbar({ view, onViewChange, action }: Props) {
  return (
    <View style={styles.bar}>
      <View style={styles.toggle}>
        <Segmented
          size="compact"
          value={view}
          onChange={onViewChange}
          options={[
            { value: "map", label: "Map", icon: (c) => <Icon name="map" size={14} color={c} /> },
            { value: "list", label: "List", icon: (c) => <Icon name="list" size={14} color={c} /> },
          ]}
        />
      </View>
      <GamePressable
        kind="sm"
        onPress={action.onPress}
        accessibilityRole="button"
        faceStyle={(pressed) => [styles.action, pressed && { backgroundColor: colors.brandPressed }]}
      >
        <Icon name="plus" size={14} color={colors.surface} />
        <Text style={styles.actionText}>{action.label}</Text>
      </GamePressable>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    height: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    paddingHorizontal: 14,
    backgroundColor: colors.surface,
    ...divider.bottom,
  },
  toggle: { width: 156 },
  action: {
    height: 36,
    paddingHorizontal: 14,
    borderRadius: 11,
    backgroundColor: colors.brand,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  actionText: { color: colors.surface, ...font(800, 13) },
});
