import { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as api from "@/api/endpoints";
import { useSubmit } from "@/api/hooks";
import { useToast } from "@/components/feedback/Toast";
import { AvatarPicker, Button, FieldLabel, TextField } from "@/components/ui";
import DegreeField from "@/features/profile/DegreeField";
import { profileRequest } from "@/features/profile/profileRequest";
import { selectMe, useAppStore } from "@/store";
import { colors, font } from "@/theme";
import { NICKNAME_MAX } from "./constants";
import { goToApp } from "./navigation";

export default function SetupScreen() {
  const { state, actions } = useAppStore();
  const toast = useToast();
  const { busy, submit } = useSubmit();
  const profile = state.session.me?.profile ?? null;
  const [nick, setNick] = useState(profile?.displayName ?? "");
  const [degree, setDegree] = useState(profile?.degree ?? null);
  const [avatar, setAvatar] = useState(state.session.avatar);
  const ready = nick.trim().length > 0 && degree !== null;

  const finish = () => {
    if (!ready || !degree) {
      toast("Add a nickname and your major");
      return;
    }
    void submit(async () => {
      await api.me.saveProfile(profileRequest(profile, { displayName: nick.trim(), degreeId: degree.id }));
      actions.setAvatar(avatar);
      await actions.refreshMe();
      toast(`Welcome to UCompass, ${nick.trim()}`);
      goToApp();
    });
  };

  return (
    <SafeAreaView style={styles.screen} edges={["top", "bottom"]}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>{"How you'll appear"}</Text>
          <Text style={styles.intro}>Stay anonymous. Pick a nickname — an avatar is optional.</Text>

          <View style={styles.group}>
            <FieldLabel>Avatar (optional)</FieldLabel>
            <AvatarPicker value={avatar} nick={nick} onChange={setAvatar} />
          </View>

          <TextField
            label="Nickname"
            value={nick}
            onChangeText={(t) => setNick(t.slice(0, NICKNAME_MAX))}
            placeholder="e.g. CompassRookie"
            height={52}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <DegreeField university={state.session.me?.university ?? "Adelaide"} value={degree} onChange={setDegree} />

          <View style={styles.group}>
            <FieldLabel>Uni</FieldLabel>
            <View style={styles.uni}>
              <Text style={styles.uniName}>{selectMe(state).uni}</Text>
              <Text style={styles.verified}>Verified via email</Text>
            </View>
          </View>
        </ScrollView>
        <View style={styles.footer}>
          <Button
            label={busy ? "Saving…" : "Enter UCompass"}
            onPress={finish}
            inactive={!ready}
            disabled={busy}
            weight={700}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surface },
  flex: { flex: 1 },
  body: { paddingHorizontal: 24, paddingVertical: 20, gap: 18 },
  title: { color: colors.ink, ...font(800, 28, 1.15, -0.02) },
  intro: { color: colors.muted, ...font(500, 14.5, 1.5) },
  group: { gap: 10 },
  uni: {
    height: 52,
    borderRadius: 14,
    paddingHorizontal: 16,
    backgroundColor: colors.canvas,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  uniName: { color: colors.ink, ...font(600, 15) },
  verified: { color: colors.brand, ...font(700, 12) },
  footer: { paddingHorizontal: 24, paddingTop: 12, paddingBottom: 12 },
});
