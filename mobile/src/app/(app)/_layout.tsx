import { Redirect, Stack } from "expo-router";
import { useAppStore } from "@/store";

// Everything in (app) needs a finished sign-in
export default function AppLayout() {
  const { state } = useAppStore();
  if (!state.session.signedIn) return <Redirect href="/login" />;
  return <Stack screenOptions={{ headerShown: false }} />;
}
