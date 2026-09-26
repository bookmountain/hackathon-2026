import { Redirect } from "expo-router";
import { selectSignedIn, useAppStore } from "@/store";

export default function Index() {
  const { state } = useAppStore();
  const { booted, me } = state.session;
  // Still checking the saved session
  if (!booted) return null;
  if (selectSignedIn(state)) return <Redirect href="/meetups" />;
  // Signed in but onboarding isn't finished
  if (me && !me.consentComplete) return <Redirect href="/consent" />;
  if (me && !me.profile) return <Redirect href="/setup" />;
  return <Redirect href="/login" />;
}
