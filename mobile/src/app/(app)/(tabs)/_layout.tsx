import { Tabs } from "expo-router/js-tabs";
import { StyleSheet, View } from "react-native";
import TabBar from "@/features/shell/TabBar";
import KoalaPeek from "@/features/stickers/KoalaPeek";

export default function TabsLayout() {
  return (
    <View style={styles.fill}>
      <Tabs screenOptions={{ headerShown: false }} tabBar={(props) => <TabBar {...props} />}>
        <Tabs.Screen name="meetups" />
        <Tabs.Screen name="flats" />
        <Tabs.Screen name="market" />
      </Tabs>
      <KoalaPeek />
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
});
