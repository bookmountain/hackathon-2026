import {
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
  useFonts,
} from "@expo-google-fonts/plus-jakarta-sans";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ToastProvider } from "@/components/feedback/Toast";
import { AppStoreProvider } from "@/store";
import { colors } from "@/theme";

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
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
