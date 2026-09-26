import { BricolageGrotesque_800ExtraBold } from "@expo-google-fonts/bricolage-grotesque";
import {
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_600SemiBold,
  DMSans_700Bold,
  useFonts,
} from "@expo-google-fonts/dm-sans";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ToastProvider } from "@/components/feedback/Toast";
import { AppStoreProvider } from "@/store";
import { colors } from "@/theme";

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_600SemiBold,
    DMSans_700Bold,
    BricolageGrotesque_800ExtraBold,
  });

  // Fall back to system fonts rather than a blank screen if loading fails
  if (!fontsLoaded && !fontError) return null;

  return (
    <AppStoreProvider>
      <ToastProvider>
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.surface } }} />
        <StatusBar style="dark" />
      </ToastProvider>
    </AppStoreProvider>
  );
}
