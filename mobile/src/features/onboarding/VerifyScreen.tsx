import { router } from "expo-router";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as api from "@/api/endpoints";
import { useSubmit } from "@/api/hooks";
import { BackButton, Button } from "@/components/ui";
import { useAppStore } from "@/store";
import { colors, font } from "@/theme";
import { continueOnboarding } from "./navigation";

const CODE_LENGTH = 6;

export default function VerifyScreen() {
  const { state, actions } = useAppStore();
  const { busy, submit } = useSubmit();
  const [code, setCode] = useState("");
  const [focused, setFocused] = useState(false);
  const complete = code.length === CODE_LENGTH;
  // The hosted demo API has no email yet, so it hands the code back to the app
  const { email, devCode } = state.session;

  const verify = () => {
    if (!complete) return;
    void submit(async () => continueOnboarding(await actions.signIn(await api.auth.verify(email, code))));
  };

  return (
    <SafeAreaView style={styles.screen} edges={["top", "bottom"]}>
      <KeyboardAvoidingView style={styles.body} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <BackButton onPress={() => router.back()} />
        <View style={styles.intro}>
          <Text style={styles.title}>Check your uni inbox</Text>
          <Text style={styles.text}>
            We sent a 6-digit code to <Text style={styles.email}>{email}</Text>.
            {" Your email is only used to verify you're a student. No one else sees it."}
          </Text>
        </View>
        <TextInput
          value={code}
          onChangeText={(t) => setCode(t.replace(/\D/g, "").slice(0, CODE_LENGTH))}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder="••••••"
          placeholderTextColor={colors.faint}
          keyboardType="number-pad"
          maxLength={CODE_LENGTH}
          autoComplete="one-time-code"
          textContentType="oneTimeCode"
          style={[styles.code, focused && { borderColor: colors.brand }]}
        />
        {devCode && (
          <Pressable onPress={() => setCode(devCode)} style={styles.autofill}>
            <Text style={styles.autofillText}>Autofill demo code</Text>
          </Pressable>
        )}
        <View style={styles.flex} />
        <Button
          label={busy ? "Verifying…" : "Verify"}
          onPress={verify}
          inactive={!complete}
          disabled={busy}
          weight={700}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surface },
  body: { flex: 1, paddingHorizontal: 24, paddingTop: 16, paddingBottom: 20, gap: 20 },
  flex: { flex: 1 },
  intro: { gap: 8 },
  title: { color: colors.ink, ...font(800, 28, 1.15, -0.02) },
  text: { color: colors.muted, ...font(500, 15, 1.5) },
  email: { color: colors.ink, ...font(700, 15) },
  code: {
    height: 64,
    borderWidth: 1.5,
    borderColor: colors.line,
    borderRadius: 16,
    paddingHorizontal: 20,
    textAlign: "center",
    color: colors.ink,
    ...font(800, 28, undefined, 0.5),
  },
  autofill: {
    alignSelf: "flex-start",
    backgroundColor: colors.brandSoft,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  autofillText: { color: colors.brand, ...font(700, 13) },
});
