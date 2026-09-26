import { Tabs } from "expo-router/js-tabs";
import TabBar from "@/features/shell/TabBar";

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false }} tabBar={(props) => <TabBar {...props} />}>
      <Tabs.Screen name="meetups" />
      <Tabs.Screen name="flats" />
      <Tabs.Screen name="market" />
    </Tabs>
  );
}
