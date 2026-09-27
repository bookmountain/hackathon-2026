import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "@/theme";
import AppHeader from "./AppHeader";
import ViewToolbar, { type TabView } from "./ViewToolbar";

type Props = {
  title: string;
  action: { label: string; onPress: () => void };
  /** Controlled by the tab so it can switch back to the map (e.g. after publishing) */
  view: TabView;
  onViewChange: (view: TabView) => void;
  children: ReactNode;
};

// Frame shared by the Flats, Market and Meetups tabs. The map is full-bleed with
// its own floating controls; the list gets the header and the Map/List bar.
export default function TabScreen({ title, action, view, onViewChange, children }: Props) {
  if (view === "map") return <View style={styles.map}>{children}</View>;
  return (
    <SafeAreaView edges={["top"]} style={styles.screen}>
      <AppHeader title={title} />
      <ViewToolbar view={view} onViewChange={onViewChange} action={action} />
      <View style={styles.content}>{children}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  map: { flex: 1, backgroundColor: colors.canvas },
  screen: { flex: 1, backgroundColor: colors.surface },
  content: { flex: 1, backgroundColor: colors.canvas },
});
