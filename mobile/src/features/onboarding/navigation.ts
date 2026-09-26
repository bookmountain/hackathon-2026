import { router } from "expo-router";
import type { Me } from "@/api/types";

/**
 * Leave onboarding for the app with a clean history, so swiping back from the
 * map can't land on login/verify/consent again.
 */
export function goToApp() {
  if (router.canDismiss()) router.dismissAll();
  router.replace("/meetups");
}

/** After signing in: consent first, then the profile, then the app */
export function continueOnboarding(me: Me) {
  if (!me.consentComplete) router.push("/consent");
  else if (!me.profile) router.push("/setup");
  else goToApp();
}
