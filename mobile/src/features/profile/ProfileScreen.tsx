import { router, useNavigation } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as api from "@/api/endpoints";
import { useSubmit } from "@/api/hooks";
import type { AvatarStyle, Degree } from "@/api/types";
import { useToast } from "@/components/feedback/Toast";
import {
  Avatar,
  AvatarPicker,
  DEFAULT_AVATAR_STYLE,
  FieldLabel,
  GamePressable,
  Icon,
  ScreenHeader,
  TextField,
} from "@/components/ui";
import { majorLabel } from "@/data/adapters";
import { ExternalArrow } from "@/features/about/AboutScreen";
import { NICKNAME_MAX, PRIVACY_LINKS } from "@/features/onboarding/constants";
import { selectMe, useAppStore } from "@/store";
import { colors, font } from "@/theme";
import DegreeField from "./DegreeField";
import DeleteAccountSheet from "./DeleteAccountSheet";
import MyActivity from "./MyActivity";
import { presetOf, profileRequest } from "./profileRequest";
import { goBack } from "@/lib/goBack";

// Like the design there's no save button: the nickname saves when you leave the
// field, the major as soon as you pick it
export default function ProfileScreen() {
  const { state, actions } = useAppStore();
  const toast = useToast();
  const { busy, submit } = useSubmit();
  const [deleting, setDeleting] = useState(false);
  const me = selectMe(state);
  const profile = state.session.me?.profile ?? null;
  const [nick, setNick] = useState(profile?.displayName ?? "");
  const [picking, setPicking] = useState(false);
  const savedStyle = me.avatarStyle ?? DEFAULT_AVATAR_STYLE;
  // The picker edits a draft; it's saved on "Done" (or when leaving the screen)
  const [draft, setDraft] = useState<{ preset: number; style: AvatarStyle }>({ preset: me.avatar, style: savedStyle });
  const avatar = picking ? draft.preset : me.avatar;
  const look = picking ? draft.style : savedStyle;
  const hasPhoto = !!me.avatarUrl;

  const save = (change: Parameters<typeof profileRequest>[1], done: string) =>
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

  const openPicker = () => {
    // Opening it without an avatar starts from the first colour
    setDraft({ preset: me.avatar < 0 ? 0 : me.avatar, style: savedStyle });
    setPicking(true);
  };

  const saveAvatar = () => {
    setPicking(false);
    const styleChanged = JSON.stringify(draft.style) !== JSON.stringify(savedStyle);
    if (styleChanged) void actions.saveAvatarStyle(draft.style);
    if (styleChanged || draft.preset !== me.avatar) {
      void save({ avatarPreset: presetOf(draft.preset), avatarStyle: draft.style }, "Avatar saved");
    }
  };

  // Leaving with the picker open saves it: back button, swipe or Android's back key
  const navigation = useNavigation();
  const saveOnLeave = useRef<() => void>(() => {});
  useEffect(() => {
    saveOnLeave.current = () => {
      if (picking) saveAvatar();
    };
  });
  useEffect(() => navigation.addListener("beforeRemove", () => saveOnLeave.current()), [navigation]);

  // Signing out flips the (app) guard, which redirects to login
  const deleteAccount = () =>
    void submit(async () => {
      await actions.deleteAccount();
      setDeleting(false);
      toast("Account deleted. Sorry to see you go.");
    });

  const pickerLabel = picking ? "Done" : avatar < 0 ? "Add avatar" : "Customise avatar";

  return (
    <SafeAreaView edges={["top"]} style={styles.screen}>
      <ScreenHeader title="Profile" onBack={() => goBack()} />
      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        <View style={styles.avatarBlock}>
          <Avatar index={avatar} nick={me.nick} url={me.avatarUrl} size={104} look={look} />
          {/* A preset colour; an uploaded photo is shown instead when there is one */}
          {!hasPhoto && (
            <GamePressable kind="sm" onPress={picking ? saveAvatar : openPicker} faceStyle={styles.avatarButton}>
              <Text style={styles.avatarButtonText}>{pickerLabel}</Text>
            </GamePressable>
          )}
        </View>
        {picking && !hasPhoto && (
          <AvatarPicker
            preset={draft.preset}
            style={draft.style}
            nick={nick}
            onChange={(preset, style) => setDraft({ preset, style })}
          />
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
            <Avatar index={avatar} nick={me.nick} url={me.avatarUrl} size={44} look={look} />
            <View style={styles.previewText}>
              <Text style={styles.previewNick}>{nick || "Your nickname"}</Text>
              <Text style={styles.previewMeta}>
                {majorLabel(profile?.degree?.name) || "Your major"} · {me.uni}
              </Text>
            </View>
          </View>
        </View>

        <MyActivity />

        <View style={styles.links}>
          <Pressable onPress={() => router.push("/about")} style={[styles.link, styles.linkDivider]}>
            <Text style={styles.linkText}>About UCompass</Text>
            <Text style={styles.linkIcon}>›</Text>
          </Pressable>
          <Pressable onPress={() => Linking.openURL(PRIVACY_LINKS.app)} style={[styles.link, styles.linkDivider]}>
            <Text style={styles.linkText}>Privacy & consent</Text>
            <ExternalArrow />
          </Pressable>
          <Pressable onPress={() => router.push("/consent")} style={[styles.link, styles.linkDivider]}>
            <Text style={styles.linkText}>Review my consents</Text>
            <Text style={styles.linkIcon}>›</Text>
          </Pressable>
          {/* Signing out flips the (app) guard, which redirects to login */}
          <Pressable onPress={actions.signOut} style={styles.link}>
            <Text style={styles.linkText}>Sign out</Text>
          </Pressable>
        </View>
        <View style={styles.deleteBlock}>
          <GamePressable kind="cta" onPress={() => setDeleting(true)} accessibilityRole="button" faceStyle={styles.deleteButton}>
            <Icon name="trash" size={16} color={colors.danger} />
            <Text style={styles.deleteText}>Delete account</Text>
          </GamePressable>
          <Text style={styles.deleteNote}>Permanently removes your profile, listings, chats and location history.</Text>
        </View>
      </ScrollView>
      <DeleteAccountSheet visible={deleting} busy={busy} onDelete={deleteAccount} onClose={() => setDeleting(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surface },
  body: { padding: 20, paddingBottom: 40, gap: 20 },
  avatarBlock: { alignItems: "center", gap: 10 },
  avatarButton: { backgroundColor: colors.brandSoft, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 7 },
  avatarButtonText: { color: colors.brand, ...font(700, 13) },
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
  links: { borderWidth: 2, borderColor: colors.ink, borderRadius: 16 },
  link: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14 },
  linkDivider: { borderBottomWidth: 2, borderBottomColor: colors.ink },
  linkText: { color: colors.ink, ...font(700, 14) },
  linkIcon: { color: colors.brand, ...font(700, 14) },
  deleteBlock: { gap: 20 },
  deleteButton: {
    height: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 14,
    backgroundColor: "#FFF5F5",
  },
  // The game CTA look: Bricolage 800 17
  deleteText: { color: colors.danger, ...font(800, 17) },
  deleteNote: { color: colors.faint, textAlign: "center", ...font(500, 12, 1.45) },
});
