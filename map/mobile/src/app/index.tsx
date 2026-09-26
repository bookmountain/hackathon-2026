import { Redirect } from "expo-router";
import { useAppStore } from "@/store";

export default function Index() {
  const { state } = useAppStore();
  return <Redirect href={state.session.signedIn ? "/flats" : "/login"} />;
}
