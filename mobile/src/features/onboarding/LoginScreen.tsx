import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ApiError } from "@/api/client";
import * as api from "@/api/endpoints";
import { useSubmit } from "@/api/hooks";
import { Button, Logo, TextField } from "@/components/ui";
import { useAppStore } from "@/store";
import { colors, font } from "@/theme";
import { continueOnboarding } from "./navigation";
import { DEMO_EMAIL, DEMO_PASSWORD, isUniEmail, PASSWORD_MIN, UNI_EMAIL_ERROR } from "./uniEmail";

type Mode = "signIn" | "signUp";

export default function LoginScreen() {
  const { actions } = useAppStore();
  const { busy, submit } = useSubmit();
  const [mode, setMode] = useState<Mode>("signIn");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  /** Registers (or re-sends the code to an unverified account) and asks for the code */
  const sendCode = async (address: string) => {
    const res = await api.auth.register(address, password);
    actions.setPending(address, res.devCode);
    router.push("/verify");
  };

  const go = () => {
    const address = email.trim().toLowerCase();
    if (!isUniEmail(address)) return setError(UNI_EMAIL_ERROR);
    if (password.length < PASSWORD_MIN) return setError(`Passwords are at least ${PASSWORD_MIN} characters.`);
    setError("");

    void submit(async () => {
      if (mode === "signUp") {
        try {
          await sendCode(address);
        } catch (e) {
          if (e instanceof ApiError && e.status === 409) {
            setMode("signIn");
            setError("You already have an account. Sign in instead.");
            return;
          }
          throw e;
        }
        return;
      }
      try {
        continueOnboarding(await actions.signIn(await api.auth.login(address, password)));
      } catch (e) {
        // Signed up earlier but never entered the code: send a new one
        if (e instanceof ApiError && e.status === 403) return sendCode(address);
        if (e instanceof ApiError && e.status === 401) return setError(e.message);
        throw e;
      }
    });
  };

  const switchMode = () => {
    setMode(mode === "signIn" ? "signUp" : "signIn");
    setError("");
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
          <Text style={styles.cardLabel}>
            {mode === "signIn" ? "Sign in with your uni email" : "Create your account with your uni email"}
          </Text>
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
            returnKeyType="next"
          />
          <TextField
            value={password}
            onChangeText={(t) => {
              setPassword(t);
              setError("");
            }}
            placeholder={mode === "signIn" ? "Password" : `Choose a password (${PASSWORD_MIN}+ characters)`}
            height={52}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete={mode === "signIn" ? "current-password" : "new-password"}
            textContentType={mode === "signIn" ? "password" : "newPassword"}
            returnKeyType="go"
            onSubmitEditing={go}
          />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <Button
            label={busy ? "One moment…" : mode === "signIn" ? "Sign in" : "Send verification code"}
            onPress={go}
            disabled={busy}
            weight={700}
            style={styles.button}
          />
          <Pressable hitSlop={8} onPress={switchMode} style={styles.switch}>
            <Text style={styles.switchText}>
              {mode === "signIn" ? "New to UCompass? Create an account" : "Already have an account? Sign in"}
            </Text>
          </Pressable>
          <View style={styles.footer}>
            <Text style={styles.footnote}>@adelaide.edu.au · @flinders.edu.au only</Text>
            <Pressable
              hitSlop={8}
              onPress={() => {
                setMode("signIn");
                setEmail(DEMO_EMAIL);
                setPassword(DEMO_PASSWORD);
                setError("");
              }}
            >
              <Text style={styles.demo}>Demo account</Text>
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
  switch: { alignSelf: "center" },
  switchText: { color: colors.brand, ...font(700, 13) },
  footer: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 12 },
  footnote: { flex: 1, color: colors.muted, ...font(500, 12) },
  demo: { color: colors.brand, ...font(700, 12) },
});
