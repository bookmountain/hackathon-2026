import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useToast } from "@/components/feedback/Toast";
import { CampusMap, MapHint } from "@/features/map";
import TabScreen from "@/features/shell/TabScreen";
import type { TabView } from "@/features/shell/ViewToolbar";
import { colors, font } from "@/theme";

export default function MeetupsTab() {
  const toast = useToast();
  const [view, setView] = useState<TabView>("map");
  return (
    <TabScreen title="Meetups" action={{ label: "Host", onPress: () => toast("Coming soon") }} view={view} onViewChange={setView}>
      {view === "map" ? (
          <CampusMap overlay={<MapHint text="Walk-in events · host & guests hidden" />} />
        ) : (
          <View style={styles.list}>
            <Text style={styles.title}>Walk-in meetups</Text>
          </View>
        )}
    </TabScreen>
  );
}

const styles = StyleSheet.create({
  list: { flex: 1, padding: 18 },
  title: { color: colors.ink, ...font(800, 22, 1.2, -0.02) },
});
