import { router } from "expo-router";
import { useState } from "react";
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { ApiError } from "@/api/client";
import * as api from "@/api/endpoints";
import { useSubmit } from "@/api/hooks";
import { BackButton, Button, FieldLabel, GamePressable, Icon, TextField } from "@/components/ui";
import { useAppStore } from "@/store";
import { colors, font } from "@/theme";
import { continueOnboarding } from "./navigation";
import {
  DEMO_EMAIL,
  DEMO_PASSWORD,
  isUniEmail,
  joinUniEmail,
  PASSWORD_MIN,
  splitUniEmail,
  UNI_DOMAINS,
  UNI_EMAIL_ERROR,
  type UniDomain,
} from "./uniEmail";
import { goBack } from "@/lib/goBack";

type Mode = "signIn" | "signUp";

// Uni email + password: sign in, or create an account and get a code.
// The design is passwordless; the API needs a password (FRONTEND-GAPS.md, "Sign in").
export default function EmailScreen() {
  const { actions } = useAppStore();
  const { busy, submit } = useSubmit();
  const [mode, setMode] = useState<Mode>("signIn");
  // The student ID is typed; the domain comes from the dropdown (only two unis can sign in)
  const [id, setId] = useState("");
  const [domain, setDomain] = useState<UniDomain>("adelaide.edu.au");
  const [picking, setPicking] = useState(false);
  const [password, setPassword] = useState("");
  const [focused, setFocused] = useState(false);
  const [error, setError] = useState("");
  const filled = id.trim().length > 0 && password.length > 0;
  // A pasted full address is used as is, so the dropdown steps aside
  const fullAddress = id.includes("@");

  /** Registers (or re-sends the code to an unverified account) and asks for the code */
  const sendCode = async (address: string) => {
    const res = await api.auth.register(address, password);
    actions.setPending(address, res.devCode);
    router.push("/verify");
  };

  const go = () => {
    const address = joinUniEmail(id, domain);
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
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
          <BackButton onPress={() => goBack("/login")} />
          <View style={styles.intro}>
            <Text style={styles.title}>{mode === "signIn" ? "Welcome back" : "Create your account"}</Text>
            <Text style={styles.text}>
              {mode === "signIn"
                ? "Sign in with your student email and password."
                : "Enter your student email. We'll send a 6-digit code to verify you."}
            </Text>
          </View>

          <View style={styles.group}>
            <FieldLabel>Uni email</FieldLabel>
            <View style={[styles.email, focused && { borderColor: colors.brand }]}>
              <Icon name="mail" size={18} color={colors.brand} />
              <TextInput
                value={id}
                onChangeText={(t) => {
                  setId(t);
                  setError("");
                }}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                placeholder="a1234567"
                placeholderTextColor={colors.faint}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="username"
                textContentType="username"
                returnKeyType="next"
                accessibilityLabel="Student ID"
                style={styles.idInput}
              />
              {!fullAddress && (
                <Pressable
                  onPress={() => setPicking(true)}
                  accessibilityRole="button"
                  accessibilityLabel={`Email domain, @${domain}`}
                  style={styles.domain}
                >
                  <Text style={styles.domainText}>@{domain}</Text>
                  <Icon name="chevronDown" size={16} color={colors.muted} />
                </Pressable>
              )}
            </View>
            <View style={styles.hintRow}>
              <Text style={styles.hint}>Type your student ID, then pick your uni</Text>
              <GamePressable
                kind="sm"
                hitSlop={6}
                accessibilityRole="button"
                onPress={() => {
                  setMode("signIn");
                  const demo = splitUniEmail(DEMO_EMAIL);
                  setId(demo.id);
                  setDomain(demo.domain);
                  setPassword(DEMO_PASSWORD);
                  setError("");
                }}
                faceStyle={(pressed) => [styles.demo, pressed && { backgroundColor: colors.brandSofter }]}
              >
                <Text style={styles.demoText}>Use demo account</Text>
              </GamePressable>
            </View>
          </View>

          <TextField
            label="Password"
            value={password}
            onChangeText={(t) => {
              setPassword(t);
              setError("");
            }}
            placeholder={mode === "signIn" ? "Your password" : `Choose a password (${PASSWORD_MIN}+ characters)`}
            height={54}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete={mode === "signIn" ? "current-password" : "new-password"}
            textContentType={mode === "signIn" ? "password" : "newPassword"}
            returnKeyType="go"
            onSubmitEditing={go}
          />
          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Pressable hitSlop={8} onPress={switchMode} style={styles.switch}>
            <Text style={styles.switchText}>
              {mode === "signIn" ? "New to UCompass? Create an account" : "Already have an account? Sign in"}
            </Text>
          </Pressable>

          <View style={styles.flex} />
          <View style={styles.note}>
            <Icon name="shield" size={16} color={colors.brand} strokeWidth={2.4} />
            <Text style={styles.noteText}>
              {"Your email is only used to verify you're a student. Other students never see it."}
            </Text>
          </View>
          <Button
            label={busy ? "One moment…" : mode === "signIn" ? "Sign in" : "Send verification code"}
            onPress={go}
            inactive={!filled}
            disabled={busy}
          />
        </ScrollView>
      </KeyboardAvoidingView>
      <DomainSheet
        visible={picking}
        value={domain}
        onPick={(d) => {
          setDomain(d);
          setError("");
          setPicking(false);
        }}
        onClose={() => setPicking(false)}
      />
    </SafeAreaView>
  );
}

// The dropdown: Adelaide Uni or Flinders
function DomainSheet({ visible, value, onPick, onClose }: {
  visible: boolean;
  value: UniDomain;
  onPick: (domain: UniDomain) => void;
  onClose: () => void;
}) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={[styles.sheet, { paddingBottom: insets.bottom + 12 }]}>
        <Text style={styles.sheetTitle}>Your uni email</Text>
        {UNI_DOMAINS.map((d) => {
          const selected = d.domain === value;
          return (
            <Pressable
              key={d.domain}
              onPress={() => onPick(d.domain)}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              style={[styles.option, selected && styles.optionSelected]}
            >
              <View style={styles.flex}>
                <Text style={[styles.optionDomain, selected && { color: colors.brand }]}>@{d.domain}</Text>
                <Text style={styles.optionUni}>{d.uni}</Text>
              </View>
              {selected && <Icon name="check" size={16} color={colors.brand} />}
            </Pressable>
          );
        })}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surface },
  flex: { flex: 1 },
  body: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 16, paddingBottom: 36, gap: 22 },
  intro: { gap: 8 },
  title: { color: colors.ink, ...font(800, 28, 1.15, -0.02) },
  text: { color: colors.muted, ...font(500, 15, 1.5) },
  group: { gap: 8 },
  email: {
    height: 54,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 2,
    borderColor: colors.ink,
    borderRadius: 14,
    paddingLeft: 16,
    backgroundColor: colors.surface,
    overflow: "hidden",
  },
  idInput: { flex: 1, minWidth: 0, height: "100%", color: colors.ink, ...font(500, 15) },
  // The dropdown half of the field
  domain: {
    height: "100%",
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    borderLeftWidth: 2,
    borderLeftColor: colors.ink,
    backgroundColor: colors.brandSoft,
  },
  domainText: { color: colors.brand, ...font(700, 14) },
  hintRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 10 },
  hint: { flex: 1, color: colors.muted, ...font(500, 12.5) },
  demo: { backgroundColor: colors.brandSoft, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 },
  demoText: { color: colors.brand, ...font(700, 12) },
  error: { color: colors.danger, marginTop: -12, ...font(600, 12.5) },
  switch: { alignSelf: "flex-start", marginTop: -8 },
  switchText: { color: colors.brand, ...font(700, 13) },
  note: {
    flexDirection: "row",
    gap: 10,
    alignItems: "flex-start",
    backgroundColor: colors.canvas,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  noteText: { flex: 1, color: colors.body, ...font(500, 12.5, 1.45) },
  backdrop: { flex: 1, backgroundColor: colors.scrim },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 18,
    paddingHorizontal: 18,
    gap: 8,
  },
  sheetTitle: { color: colors.ink, marginBottom: 4, ...font(800, 18) },
  option: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 2,
    borderColor: colors.lineNeutral,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  optionSelected: { borderColor: colors.brand, backgroundColor: colors.brandSoft },
  optionDomain: { color: colors.ink, ...font(700, 15) },
  optionUni: { color: colors.muted, ...font(500, 12.5) },
});
