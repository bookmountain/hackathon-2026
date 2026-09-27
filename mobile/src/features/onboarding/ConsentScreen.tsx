import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Linking, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as api from "@/api/endpoints";
import { useSubmit } from "@/api/hooks";
import type { ConsentsResponse, ConsentType } from "@/api/types";
import { Button, Checkbox, GamePressable, Icon } from "@/components/ui";
import { useToast } from "@/components/feedback/Toast";
import { selectMe, selectSignedIn, useAppStore } from "@/store";
import { colors, divider, font } from "@/theme";
import { PRIVACY_LINKS } from "./constants";
import { goToApp } from "./navigation";
import { goBack } from "@/lib/goBack";

type Consents = { terms: boolean; location: boolean; age: boolean };

const NO_CONSENTS: Consents = { terms: false, location: false, age: false };

function fromApi(res: ConsentsResponse): Consents {
  const granted = (type: ConsentType) => !!res.items.find((i) => i.type === type)?.granted;
  return {
    terms: granted("Terms"),
    location: granted("Location"),
    age: granted("AgeAndEnrolment"),
  };
}

const SUMMARY = [
  [
    "Others only ever see",
    "Your nickname, major and uni. An avatar only if you choose one. Your daily card match also sees your year, pronouns, bio and interests.",
  ],
  ["Location is approximate", "Snapped to a campus zone, never your exact spot or home address."],
  ["We never share or sell", "Your email, real name or student ID. Delete your account and data anytime."],
] as const;

// The v4 design drops the optional usage-stats consent; the API still takes it, so it's sent as false
const CHECKS: { key: keyof Consents; label: string }[] = [
  { key: "terms", label: "I agree to the Terms of Use and Privacy Policy" },
  { key: "location", label: "Use my approximate campus-zone location on the map" },
  { key: "age", label: "I'm 18+ and currently enrolled at Adelaide Uni or Flinders" },
];

function Link({ url, children }: { url: string; children: string }) {
  return (
    <Text style={styles.link} onPress={() => Linking.openURL(url)} accessibilityRole="link">
      {children}
    </Text>
  );
}

// Also reached from Profile → "Review my consents"
export default function ConsentScreen() {
  const { state, actions } = useAppStore();
  const toast = useToast();
  const { busy, submit } = useSubmit();
  const [consents, setConsents] = useState<Consents>(NO_CONSENTS);
  const ready = CHECKS.every((c) => consents[c.key]);
  // Reviewing from Profile rather than onboarding
  const reviewing = selectSignedIn(state);

  // Show what was agreed before (Profile → "Review my consents", or signing in again)
  useEffect(() => {
    let active = true;
    api.me.getConsents().then(
      (res) => active && setConsents(fromApi(res)),
      () => {},
    );
    return () => {
      active = false;
    };
  }, []);

  const accept = () => {
    if (!ready) {
      toast("Tick all three boxes to continue");
      return;
    }
    void submit(async () => {
      await api.me.saveConsents({
        terms: consents.terms,
        location: consents.location,
        ageAndEnrolment: consents.age,
        usageStats: false,
      });
      const me = await actions.refreshMe();
      if (reviewing) goBack("/login");
      else if (me.profile) goToApp();
      else router.push("/setup");
    });
  };

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.body}>
        <View style={styles.badge}>
          <Icon name="shield" size={14} color={colors.brand} />
          <Text style={styles.badgeText}>Verified student · {selectMe(state).uni}</Text>
        </View>
        <Text style={styles.title}>Before you start</Text>
        <Text style={styles.intro}>
          Plain-English summary of how UCompass handles your data, aligned with the{" "}
          <Link url={PRIVACY_LINKS.app}>Australian Privacy Principles</Link> under the{" "}
          <Link url={PRIVACY_LINKS.act}>Privacy Act 1988 (Cth)</Link>.
        </Text>

        <View style={styles.summary}>
          {SUMMARY.map(([title, text]) => (
            <View key={title} style={styles.summaryRow}>
              <Text style={styles.summaryTitle}>{title}</Text>
              <Text style={styles.summaryText}>{text}</Text>
            </View>
          ))}
          <View style={styles.summaryRow}>
            <Text style={styles.summaryTitle}>Report & block in one tap</Text>
            <Text style={styles.summaryText}>
              Serious issues can be escalated to the <Link url={PRIVACY_LINKS.esafety}>eSafety Commissioner</Link>.
            </Text>
          </View>
        </View>

        <GamePressable
          kind="row"
          onPress={() => setConsents(ready ? NO_CONSENTS : { terms: true, location: true, age: true })}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: ready }}
          faceStyle={[styles.all, ready ? styles.allOn : styles.allOff]}
        >
          <View style={[styles.allBox, ready ? styles.allBoxOn : styles.allOff]}>
            {ready && <Icon name="check" size={14} color={colors.surface} />}
          </View>
          <Text style={styles.allLabel}>Agree to all</Text>
        </GamePressable>

        {CHECKS.map((c) => (
          <Checkbox
            key={c.key}
            checked={consents[c.key]}
            onPress={() => setConsents({ ...consents, [c.key]: !consents[c.key] })}
            label={c.label}
            note="(required)"
          />
        ))}
      </ScrollView>
      <View style={styles.footer}>
        <Button
          label={busy ? "Saving…" : "I agree & continue"}
          onPress={accept}
          inactive={!ready}
          disabled={busy}
          variant="flat"
          weight={700}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surface },
  body: { paddingHorizontal: 24, paddingTop: 20, paddingBottom: 16, gap: 18 },
  badge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.brandSoft,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  badgeText: { color: colors.brand, ...font(700, 12) },
  title: { color: colors.ink, ...font(800, 28, 1.15, -0.02) },
  intro: { color: colors.muted, ...font(500, 14.5, 1.5) },
  link: { color: colors.brand, textDecorationLine: "underline" },
  summary: { gap: 1, backgroundColor: colors.ink, borderRadius: 18, overflow: "hidden" },
  summaryRow: { backgroundColor: colors.canvas, paddingHorizontal: 16, paddingVertical: 14, gap: 3 },
  summaryTitle: { color: colors.ink, ...font(700, 14) },
  summaryText: { color: colors.body, ...font(500, 13.5, 1.45) },
  all: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 2,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  allOn: { borderColor: colors.brand, backgroundColor: colors.brandSoft },
  allOff: { borderColor: colors.checkbox, backgroundColor: colors.surface },
  allBox: {
    width: 24,
    height: 24,
    borderRadius: 7,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  allBoxOn: { borderColor: colors.brand, backgroundColor: colors.brand },
  allLabel: { color: colors.ink, ...font(800, 14.5) },
  footer: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 34,
    ...divider.top,
  },
});
