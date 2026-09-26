import { router } from "expo-router";
import { useState } from "react";
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as api from "@/api/endpoints";
import { useSubmit } from "@/api/hooks";
import type { Degree } from "@/api/types";
import { useToast } from "@/components/feedback/Toast";
import { Avatar, AvatarPicker, FieldLabel, ScreenHeader, TextField } from "@/components/ui";
import { majorLabel } from "@/data/adapters";
import { NICKNAME_MAX, PRIVACY_LINKS } from "@/features/onboarding/constants";
import { selectMe, useAppStore } from "@/store";
import { colors, font } from "@/theme";
import DegreeField from "./DegreeField";
import { profileRequest } from "./profileRequest";

// Like the design there's no save button: the nickname saves when you leave the
// field, the major as soon as you pick it
export default function ProfileScreen() {
  const { state, actions } = useAppStore();
  const toast = useToast();
  const { submit } = useSubmit();
  const me = selectMe(state);
  const profile = state.session.me?.profile ?? null;
  const [nick, setNick] = useState(profile?.displayName ?? "");
  const [picking, setPicking] = useState(false);
  const { avatar } = state.session;
  const hasPhoto = !!me.avatarUrl;

  const save = (change: { displayName?: string; degreeId?: number }, done: string) =>
    submit(async () => {
      await api.me.saveProfile(profileRequest(profile, change));
      await actions.refreshMe();
      toast(done);
    });

  const saveNick = () => {
    const trimmed = nick.trim();
    if (!trimmed) {
      setNick(profile?.displayName ?? "");
      toast("Your nickname can't be empty");
    } else if (trimmed !== profile?.displayName) {
      void save({ displayName: trimmed }, "Nickname saved");
    }
  };

  const saveDegree = (degree: Degree) => {
    if (degree.id !== profile?.degree?.id) void save({ degreeId: degree.id }, "Major saved");
  };

  const pickerLabel = picking ? "Done" : avatar < 0 ? "Add avatar (optional)" : "Edit avatar";

  return (
    <SafeAreaView edges={["top"]} style={styles.screen}>
      <ScreenHeader title="Profile" onBack={() => router.back()} />
      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        <View style={styles.avatarBlock}>
          <Avatar index={avatar} nick={me.nick} url={me.avatarUrl} size={96} />
          {/* Preset colours are drawn by the app; an uploaded photo always wins */}
          {!hasPhoto && (
            <Pressable onPress={() => setPicking(!picking)} style={styles.avatarButton}>
              <Text style={styles.avatarButtonText}>{pickerLabel}</Text>
            </Pressable>
          )}
        </View>
        {picking && !hasPhoto && (
          <View style={styles.picker}>
            <AvatarPicker value={avatar} nick={nick} onChange={actions.setAvatar} size={18} />
          </View>
        )}

        <TextField
          label="Nickname"
          value={nick}
          onChangeText={(t) => setNick(t.slice(0, NICKNAME_MAX))}
          onEndEditing={saveNick}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="done"
        />
        {state.session.me && (
          <DegreeField university={state.session.me.university} value={profile?.degree ?? null} onChange={saveDegree} />
        )}
        <View style={styles.group}>
          <FieldLabel>Uni</FieldLabel>
          <View style={styles.uni}>
            <Text style={styles.uniName}>{me.uni}</Text>
            <Text style={styles.verified}>Verified</Text>
          </View>
        </View>

        <View style={styles.preview}>
          <Text style={styles.previewLabel}>What others see</Text>
          <View style={styles.previewRow}>
            <Avatar index={avatar} nick={me.nick} url={me.avatarUrl} size={44} />
            <View style={styles.previewText}>
              <Text style={styles.previewNick}>{nick || "Your nickname"}</Text>
              <Text style={styles.previewMeta}>
                {majorLabel(profile?.degree?.name) || "Your major"} · {me.uni}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.links}>
          <Pressable onPress={() => Linking.openURL(PRIVACY_LINKS.app)} style={[styles.link, styles.linkDivider]}>
            <Text style={styles.linkText}>Privacy & consent (APP)</Text>
            <Text style={styles.linkIcon}>↗</Text>
          </Pressable>
          <Pressable onPress={() => router.push("/consent")} style={[styles.link, styles.linkDivider]}>
            <Text style={styles.linkText}>Review my consents</Text>
            <Text style={styles.linkIcon}>›</Text>
          </Pressable>
          {/* Signing out flips the (app) guard, which redirects to login */}
          <Pressable onPress={actions.signOut} style={styles.link}>
            <Text style={[styles.linkText, { color: colors.danger }]}>Sign out</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surface },
  body: { padding: 20, gap: 20 },
  avatarBlock: { alignItems: "center", gap: 10 },
  avatarButton: { backgroundColor: colors.brandSoft, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 7 },
  avatarButtonText: { color: colors.brand, ...font(700, 13) },
  picker: { backgroundColor: colors.canvas, borderRadius: 18, padding: 14 },
  group: { gap: 8 },
  uni: {
    height: 50,
    borderRadius: 14,
    paddingHorizontal: 16,
    backgroundColor: colors.canvas,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  uniName: { color: colors.ink, ...font(600, 15) },
  verified: { color: colors.brand, ...font(700, 12) },
  preview: { backgroundColor: colors.ink, borderRadius: 20, padding: 16, gap: 12 },
  previewLabel: { color: colors.brandLight, textTransform: "uppercase", ...font(700, 12, undefined, 0.06) },
  previewRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  previewText: { flex: 1, gap: 2 },
  previewNick: { color: colors.surface, ...font(800, 15) },
  previewMeta: { color: colors.brandLight, ...font(500, 12.5) },
  links: { borderWidth: 1.5, borderColor: colors.lineSoft, borderRadius: 16 },
  link: { flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 14 },
  linkDivider: { borderBottomWidth: 1, borderBottomColor: colors.lineSoft },
  linkText: { color: colors.ink, ...font(700, 14) },
  linkIcon: { color: colors.brand, ...font(700, 14) },
});
