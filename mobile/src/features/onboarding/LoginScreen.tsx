import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button, Logo, TextField } from "@/components/ui";
import { useAppStore } from "@/store";
import { colors, font } from "@/theme";
import { DEMO_EMAIL, isUniEmail, UNI_EMAIL_ERROR } from "./uniEmail";

export default function LoginScreen() {
  const { actions } = useAppStore();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");

  const sendCode = () => {
    if (!isUniEmail(email)) {
      setError(UNI_EMAIL_ERROR);
      return;
    }
    // No backend yet: pretend the code was emailed
    actions.signIn(email.trim());
    router.push("/verify");
  };

  return (
    <SafeAreaView style={styles.screen} edges={["top", "bottom"]}>
      <StatusBar style="light" />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <View style={styles.hero}>
          <Logo size={72} variant="onBrand" ring />
          <Text style={styles.title}>UCompass</Text>
          <Text style={styles.tagline}>
            Flatmates, bargains and meetups across Adelaide Uni & Flinders — each on its own map.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardLabel}>Sign in with your uni email</Text>
          <TextField
            value={email}
            onChangeText={(t) => {
              setEmail(t);
              setError("");
            }}
            placeholder={DEMO_EMAIL}
            height={52}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
            textContentType="emailAddress"
            returnKeyType="send"
            onSubmitEditing={sendCode}
          />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <Button label="Send verification code" onPress={sendCode} weight={700} style={styles.button} />
          <View style={styles.footer}>
            <Text style={styles.footnote}>@adelaide.edu.au · @flinders.edu.au only</Text>
            <Pressable
              hitSlop={8}
              onPress={() => {
                setEmail(DEMO_EMAIL);
                setError("");
              }}
            >
              <Text style={styles.demo}>Demo email</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.brand },
  flex: { flex: 1, paddingHorizontal: 28, paddingTop: 40, paddingBottom: 20 },
  hero: { flex: 1, justifyContent: "center", gap: 18 },
  title: { color: colors.surface, ...font(800, 40, 1, -0.03) },
  tagline: { color: "#DCE6FF", maxWidth: 290, ...font(500, 17, 1.45) },
  card: { backgroundColor: colors.surface, borderRadius: 24, padding: 20, gap: 12 },
  cardLabel: { color: colors.muted, ...font(700, 13) },
  error: { color: colors.danger, ...font(600, 12.5) },
  button: { height: 52 },
  footer: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 12 },
  footnote: { flex: 1, color: colors.muted, ...font(500, 12) },
  demo: { color: colors.brand, ...font(700, 12) },
});
