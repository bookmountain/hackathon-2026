import { StyleSheet, Text, View } from "react-native";
import { Button } from "@/components/ui";
import { useAppStore } from "@/store";
import { colors, font } from "@/theme";

// Placeholder until the app shell lands in the next commit
export default function FlatsPlaceholder() {
  const { state, actions } = useAppStore();
  return (
    <View style={styles.screen}>
      <Text style={font(800, 22)}>Signed in as {state.session.nick}</Text>
      <Button label="Sign out" variant="outline" onPress={actions.signOut} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, alignItems: "center", justifyContent: "center", gap: 16, backgroundColor: colors.canvas },
});
