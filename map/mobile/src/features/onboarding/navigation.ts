import { router } from "expo-router";

/**
 * Leave onboarding for the app with a clean history, so swiping back from the
 * map can't land on login/verify/consent again.
 */
export function goToApp() {
  if (router.canDismiss()) router.dismissAll();
  router.replace("/meetups");
}
