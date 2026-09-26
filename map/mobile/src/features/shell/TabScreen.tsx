import { useState, type ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "@/theme";
import AppHeader from "./AppHeader";
import ViewToolbar, { type TabView } from "./ViewToolbar";

type Props = {
  title: string;
  action: { label: string; onPress: () => void };
  /** Content for the current Map/List view */
  children: (view: TabView) => ReactNode;
  /** Called when switching views, e.g. to close an open map sheet */
  onViewChange?: (view: TabView) => void;
};

// Frame shared by the Flats, Market and Meetups tabs
export default function TabScreen({ title, action, children, onViewChange }: Props) {
  const [view, setView] = useState<TabView>("map");
  return (
    <SafeAreaView edges={["top"]} style={styles.screen}>
      <AppHeader title={title} />
      <ViewToolbar
        view={view}
        onViewChange={(v) => {
          setView(v);
          onViewChange?.(v);
        }}
        action={action}
      />
      <View style={styles.content}>{children(view)}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surface },
  content: { flex: 1, backgroundColor: colors.canvas },
});
