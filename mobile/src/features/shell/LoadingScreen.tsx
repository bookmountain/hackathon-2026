import { router } from "expo-router";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button, ScreenHeader } from "@/components/ui";
import { colors, font } from "@/theme";

// Detail screen placeholder while its data loads, or when loading failed
export function LoadingScreen({ error, onRetry }: { error?: string; onRetry: () => void }) {
  return (
    <SafeAreaView edges={["top", "bottom"]} style={styles.screen}>
      <ScreenHeader onBack={() => router.back()} bordered={false} />
      <View style={styles.body}>
        {error ? (
          <>
            <Text style={styles.error}>{error}</Text>
            <Button label="Try again" size="md" variant="soft" onPress={onRetry} />
          </>
        ) : (
          <ActivityIndicator color={colors.brand} size="large" />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surface },
  body: { flex: 1, alignItems: "center", justifyContent: "center", gap: 16, padding: 32 },
  error: { color: colors.muted, textAlign: "center", ...font(600, 14.5, 1.5) },
});
