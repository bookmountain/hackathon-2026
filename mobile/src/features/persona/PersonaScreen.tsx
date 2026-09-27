import { useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as api from "@/api/endpoints";
import { useSubmit } from "@/api/hooks";
import { useToast } from "@/components/feedback/Toast";
import { Button, Chip, GamePressable, ScreenHeader, Segmented } from "@/components/ui";
import { goToApp } from "@/features/onboarding/navigation";
import { profileRequest } from "@/features/profile/profileRequest";
import { useAppStore } from "@/store";
import { colors, font } from "@/theme";
import { GOALS, INTERESTS, STUDY_LEVELS, type StudyLevel } from "./constants";
import { missingHint, profileInterestTags, toggle, type Persona } from "./logic";
import { savePersona, usePersona } from "./usePersona";
import { goBack } from "@/lib/goBack";

/** Design colours with no theme token: unselected emoji tile, footer rule */
const TILE_OFF = "#F0F3FA";
const FOOTER_LINE = "#ECEEF6";

const LEVEL_OPTIONS = STUDY_LEVELS.map((l) => ({ value: l, label: l }));

function Label({ children }: { children: string }) {
  return (
    <Text style={styles.label}>
      {children} <Text style={styles.required}>*</Text>
    </Text>
  );
}

// "Make it yours": straight after Setup (?from=setup), or later from
// "Edit interests" / "Personalise" to change it (back button, "Save")
export default function PersonaScreen() {
  const { from } = useLocalSearchParams<{ from?: string }>();
  const onboarding = from === "setup";
  const { state, actions } = useAppStore();
  const toast = useToast();
  const { busy, submit } = useSubmit();
  const saved = usePersona();
  // Untouched, the form follows what's saved (it may still be loading from the device)
  const [draft, setDraft] = useState<Persona | null>(null);
  const persona = draft ?? saved.persona;
  const hint = missingHint(persona);
  const update = (change: Partial<Persona>) => setDraft({ ...persona, ...change });

  const finish = () => {
    if (hint) {
      toast("Please complete all required fields");
      return;
    }
    void submit(async () => {
      const profile = state.session.me?.profile ?? null;
      await api.me.saveProfile(
        profileRequest(profile, { interests: profileInterestTags(profile?.interests ?? [], persona.interests) }),
      );
      await actions.refreshMe();
      savePersona(persona);
      if (onboarding) {
        toast(`Welcome to UCompass, ${profile?.displayName || "mate"}`);
        goToApp();
      } else {
        toast("Interests saved");
        goBack();
      }
    });
  };

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      {!onboarding && <ScreenHeader onBack={() => goBack()} bordered={false} />}
      <ScrollView contentContainerStyle={styles.body}>
        <View style={styles.head}>
          <Text style={styles.title}>Make it yours</Text>
          <Text style={styles.intro}>
            {"Pick what you're into and what you're here for. We'll tune your map, meetups and matches around it."}
          </Text>
        </View>

        <View style={styles.group}>
          <Label>What are you here for?</Label>
          <View style={styles.goals}>
            {GOALS.map((g) => {
              const on = persona.goals.includes(g.key);
              return (
                <GamePressable
                  kind="row"
                  key={g.key}
                  onPress={() => update({ goals: toggle(persona.goals, g.key) })}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: on }}
                  faceStyle={[styles.goal, on ? styles.goalOn : styles.goalOff]}
                >
                  <View style={[styles.goalTile, { backgroundColor: on ? colors.brand : TILE_OFF }]}>
                    <Text style={styles.goalEmoji}>{g.emoji}</Text>
                  </View>
                  <View style={styles.goalText}>
                    <Text style={styles.goalTitle}>{g.title}</Text>
                    <Text style={styles.goalLine}>{g.line}</Text>
                  </View>
                </GamePressable>
              );
            })}
          </View>
        </View>

        <View style={styles.group}>
          <Label>Your interests</Label>
          <View style={styles.chips}>
            {INTERESTS.map((i) => (
              <Chip
                key={i}
                label={i}
                height={38}
                active={persona.interests.includes(i)}
                onPress={() => update({ interests: toggle(persona.interests, i) })}
              />
            ))}
          </View>
        </View>

        <View style={styles.levelGroup}>
          <Label>Study level</Label>
          <Segmented<StudyLevel | "">
            options={LEVEL_OPTIONS}
            value={persona.level ?? ""}
            onChange={(level) => update({ level: level || null })}
          />
        </View>
      </ScrollView>
      <View style={styles.footer}>
        {hint && <Text style={styles.hint}>{hint}</Text>}
        <Button
          label={busy ? "Saving…" : onboarding ? "Enter UCompass" : "Save"}
          onPress={finish}
          inactive={!!hint}
          disabled={busy}
          weight={700}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surface },
  body: { paddingHorizontal: 24, paddingVertical: 20, gap: 20 },
  head: { gap: 6 },
  title: { color: colors.ink, ...font(800, 26, 1.1) },
  intro: { color: colors.muted, ...font(500, 14.5, 1.5) },
  group: { gap: 10 },
  levelGroup: { gap: 8 },
  label: { color: colors.muted, ...font(700, 13) },
  required: { color: colors.danger },
  goals: { gap: 8 },
  goal: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 2,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  goalOn: { borderColor: colors.brand, backgroundColor: colors.blueTint },
  goalOff: { borderColor: colors.lineLight, backgroundColor: colors.surface },
  goalTile: { width: 38, height: 38, borderRadius: 11, alignItems: "center", justifyContent: "center" },
  goalEmoji: { fontSize: 18 },
  goalText: { flex: 1, gap: 1 },
  goalTitle: { color: colors.ink, ...font(800, 14.5) },
  goalLine: { color: colors.muted, ...font(500, 12.5) },
  // Room below the last row for the chips' ledge
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8, rowGap: 11, paddingBottom: 3 },
  footer: {
    paddingHorizontal: 24,
    paddingTop: 10,
    paddingBottom: 34,
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: FOOTER_LINE,
  },
  hint: { color: colors.danger, textAlign: "center", ...font(600, 12.5) },
});
