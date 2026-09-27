import { router, type Href } from "expo-router";

/**
 * Back when there's somewhere to go back to. A screen opened straight from a link (or
 * restored on its own) has no history, so go to `fallback` instead of a GO_BACK error.
 */
export function goBack(fallback: Href = "/meetups") {
  if (router.canGoBack()) router.back();
  else router.replace(fallback);
}
