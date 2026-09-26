import { StyleSheet, Text, View } from "react-native";
import { useToast } from "@/components/feedback/Toast";
import { CampusMap, MapHint } from "@/features/map";
import TabScreen from "@/features/shell/TabScreen";
import { colors, font } from "@/theme";

export default function MarketTab() {
  const toast = useToast();
  return (
    <TabScreen title="Market" action={{ label: "Sell", onPress: () => toast("Coming soon") }}>
      {(view) =>
        view === "map" ? (
          <CampusMap overlay={<MapHint text="★ Safe pickup points · tags = seller pins" />} />
        ) : (
          <View style={styles.list}>
            <Text style={styles.title}>Items from fellow students</Text>
          </View>
        )
      }
    </TabScreen>
  );
}

const styles = StyleSheet.create({
  list: { flex: 1, padding: 18 },
  title: { color: colors.ink, ...font(800, 22, 1.2, -0.02) },
});
