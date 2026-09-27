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

/**
 * After Setup saves the profile: "Make it yours", then the app. It replaces onboarding
 * (like goToApp) so back from the app can't reach Setup again.
 */
export function goToPersona() {
  if (router.canDismiss()) router.dismissAll();
  router.replace({ pathname: "/persona", params: { from: "setup" } });
}

/** After signing in (returning users with a profile skip "Make it yours"): consent first, then the profile, then the app */
export function continueOnboarding(me: Me) {
  if (!me.consentComplete) router.push("/consent");
  else if (!me.profile) router.push("/setup");
  else goToApp();
}
