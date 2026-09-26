import { router } from "expo-router";
import { useState } from "react";
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Avatar, AvatarPicker, FieldLabel, ScreenHeader, SelectField, TextField } from "@/components/ui";
import { MAJORS } from "@/data/seed";
import { NICKNAME_MAX, PRIVACY_LINKS } from "@/features/onboarding/constants";
import { selectMe, useAppStore } from "@/store";
import { colors, font } from "@/theme";

// Edits apply immediately, like the design (no save button)
export default function ProfileScreen() {
  const { state, actions } = useAppStore();
  const me = selectMe(state);
  const { nick, major, avatar } = state.session;
  const [picking, setPicking] = useState(false);

  const pickerLabel = picking ? "Done" : avatar < 0 ? "Add avatar (optional)" : "Edit avatar";

  return (
    <SafeAreaView edges={["top"]} style={styles.screen}>
      <ScreenHeader title="Profile" onBack={() => router.back()} />
      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        <View style={styles.avatarBlock}>
          <Avatar index={avatar} nick={me.nick} size={96} />
          <Pressable onPress={() => setPicking(!picking)} style={styles.avatarButton}>
            <Text style={styles.avatarButtonText}>{pickerLabel}</Text>
          </Pressable>
        </View>
        {picking && (
          <View style={styles.picker}>
            <AvatarPicker value={avatar} nick={nick} onChange={(i) => actions.updateProfile({ avatar: i })} size={18} />
          </View>
        )}

        <TextField
          label="Nickname"
          value={nick}
          onChangeText={(t) => actions.updateProfile({ nick: t.slice(0, NICKNAME_MAX) })}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <SelectField
          label="Major"
          value={major}
          options={MAJORS}
          onChange={(m) => actions.updateProfile({ major: m })}
          placeholder="Select your major"
        />
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
            <Avatar index={avatar} nick={me.nick} size={44} />
            <View style={styles.previewText}>
              <Text style={styles.previewNick}>{nick || "Your nickname"}</Text>
              <Text style={styles.previewMeta}>
                {major || "Your major"} · {me.uni}
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
  previewText: { gap: 2 },
  previewNick: { color: colors.surface, ...font(800, 15) },
  previewMeta: { color: colors.brandLight, ...font(500, 12.5) },
  links: { borderWidth: 1.5, borderColor: colors.lineSoft, borderRadius: 16 },
  link: { flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 14 },
  linkDivider: { borderBottomWidth: 1, borderBottomColor: colors.lineSoft },
  linkText: { color: colors.ink, ...font(700, 14) },
  linkIcon: { color: colors.brand, ...font(700, 14) },
});
