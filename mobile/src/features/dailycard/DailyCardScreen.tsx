import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Animated, Easing, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { errorMessage } from "@/api/client";
import { useToast } from "@/components/feedback/Toast";
import { Avatar, Button, Icon, Logo, ScreenHeader, Sticker } from "@/components/ui";
import type { MatchDetailsDto } from "@/api/types";
import type { Person } from "@/data/types";
import { startChat } from "@/features/chat/startChat";
import { useAppStore } from "@/store";
import { colors, font } from "@/theme";
import { DEMO_STUDENTS, formatClock, interestLabel, isDemoStudent, sharedLine, yearLabel } from "./logic";
import { demo, drawDailyCard, loadDailyCard, refreshAfterClock, SHUFFLE_MS, useDailyCard } from "./useDailyCard";
import { goBack } from "@/lib/goBack";

const RULES = [
  "One card a day. A fresh deck opens every midnight.",
  "You're matched with another student who drew today.",
  "Miss a day and your next draw only restarts the deck. It opens at midnight.",
];

type Phase = "ready" | "spinning" | "matched" | "missed";

type SubInfo = { drawnToday: number; missedDay: boolean };

const COPY: Record<Phase, { title: string; sub: (info: SubInfo) => string; clockLabel: string; clockColor: string }> = {
  ready: {
    title: "Draw your card",
    sub: ({ drawnToday, missedDay }) =>
      missedDay
        ? "You missed yesterday, so drawing now restarts your deck. Your next card opens at midnight."
        : `${drawnToday} students have drawn today. Flip a card to meet one of them.`,
    clockLabel: "Deck resets in",
    clockColor: colors.ink,
  },
  spinning: {
    title: "Shuffling the deck…",
    sub: () => "Dealing you a fellow student from Adelaide Uni & Flinders.",
    clockLabel: "Deck resets in",
    clockColor: colors.ink,
  },
  matched: {
    title: "Your card today",
    sub: () => "Say hi before midnight. Your next card opens tomorrow.",
    clockLabel: "Next draw in",
    clockColor: colors.brand,
  },
  missed: {
    title: "Deck locked",
    sub: () => "You missed a day, so this draw restarted your deck. Your next card opens at midnight.",
    clockLabel: "Unlocks in",
    clockColor: colors.danger,
  },
};

/** Seconds tick while the screen is open */
function useNow() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  return now;
}

function CardFront() {
  return (
    <View style={[styles.face, styles.front]}>
      <View style={styles.frontFrame} />
      <Logo size={120} ring />
      <View style={styles.frontTag}>
        <Text style={styles.frontTagText}>UCOMPASS</Text>
      </View>
      <Text style={[styles.corner, styles.cornerTop]}>★</Text>
      <Text style={[styles.corner, styles.cornerBottom]}>★</Text>
    </View>
  );
}

/** Interests shown on the card: yours in common first, then the rest */
const MAX_INTERESTS = 6;

function CardBack({ person, details }: { person: Person | null; details: MatchDetailsDto | null }) {
  const shared = details?.sharedInterests ?? [];
  const interests = details
    ? [...shared, ...details.interests.filter((t) => !shared.includes(t))].slice(0, MAX_INTERESTS)
    : [];
  const together = sharedLine(shared);
  return (
    <View style={[styles.face, styles.back]}>
      {/* A strip of tape, like the login screen's polaroids */}
      <View style={styles.tape} />
      {person && (
        <>
          <Avatar index={person.avatar} nick={person.nick} url={person.avatarUrl} look={person.avatarStyle} size={84} />
          <View style={styles.nameRow}>
            <Text style={styles.backNick} numberOfLines={1}>
              {person.nick}
            </Text>
            {!!details?.pronouns && <Text style={styles.pronouns}>{details.pronouns}</Text>}
          </View>
          {!!person.major && (
            <Text style={styles.backMajor} numberOfLines={2}>
              {person.major}
            </Text>
          )}
          <View style={styles.pills}>
            <View style={styles.backUni}>
              <Text style={styles.backUniText}>{person.uni}</Text>
            </View>
            {details?.yearOfStudy != null && (
              <View style={styles.year}>
                <Text style={styles.yearText}>{yearLabel(details.yearOfStudy)}</Text>
              </View>
            )}
          </View>
          {!!details?.bio && (
            <Text style={styles.bio} numberOfLines={3}>
              “{details.bio}”
            </Text>
          )}
          {interests.length > 0 && (
            <View style={styles.interests}>
              <View style={styles.dash} />
              {together && <Text style={styles.together}>★ {together}</Text>}
              <View style={styles.chips}>
                {interests.map((tag) => {
                  const both = shared.includes(tag);
                  return (
                    <View key={tag} style={[styles.chip, both && styles.chipShared]}>
                      <Text style={[styles.chipText, both && styles.chipSharedText]}>{interestLabel(tag)}</Text>
                    </View>
                  );
                })}
              </View>
            </View>
          )}
        </>
      )}
    </View>
  );
}

// Centre tab button: one card a day to meet a random fellow student
export default function DailyCardScreen() {
  const { state, actions } = useAppStore();
  const toast = useToast();
  const now = useNow();
  const card = useDailyCard();
  const userId = state.session.me?.userId ?? null;
  const view = card.userId === userId ? card.view : null;
  const phase: Phase = card.spinning
    ? "spinning"
    : view?.status === "Matched"
      ? "matched"
      : view?.status === "Missed"
        ? "missed"
        : "ready";
  const copy = COPY[phase];

  useEffect(() => {
    if (userId) loadDailyCard(userId).catch((e) => toast(errorMessage(e)));
  }, [userId, toast]);

  // Midnight or the end of the lock: move on to the next state
  const remaining = view ? view.nextChangeAt.getTime() - now.getTime() : 0;
  const expired = !!view && remaining <= 0;
  useEffect(() => {
    if (expired) refreshAfterClock();
  }, [expired]);

  // Students you already know; demo stand-ins when there's nobody yet
  const pool = useMemo(() => {
    const seen = new Map<string, Person>();
    for (const c of state.chats) if (c.person.id !== userId) seen.set(c.person.id, c.person);
    return seen.size ? [...seen.values()] : DEMO_STUDENTS;
  }, [state.chats, userId]);

  // Spin while dealing, then land face up on the match
  const [rotation] = useState(() => new Animated.Value(0));
  useEffect(() => {
    if (phase === "spinning") {
      rotation.setValue(0);
      Animated.timing(rotation, {
        toValue: 1800,
        duration: SHUFFLE_MS,
        easing: Easing.bezier(0.3, 0.1, 0.2, 1),
        useNativeDriver: true,
      }).start();
    } else if (phase === "matched") {
      rotation.setValue(0);
      Animated.timing(rotation, {
        toValue: 180,
        duration: 800,
        easing: Easing.bezier(0.2, 0.7, 0.2, 1),
        useNativeDriver: true,
      }).start();
    } else {
      rotation.setValue(0);
    }
  }, [phase, rotation]);
  const [frontTurn, backTurn] = useMemo(() => {
    const turn = (offset: number) =>
      Animated.add(rotation, offset).interpolate({ inputRange: [0, 3600], outputRange: ["0deg", "3600deg"] });
    return [turn(0), turn(180)];
  }, [rotation]);

  const message = async (person: Person, drawId: string | null) => {
    if (isDemoStudent(person)) {
      toast("This is a demo student, so there's no chat to open");
      return;
    }
    try {
      // drawId adds the "Daily card match · 27 Sep" line; the device copy only has the student
      const to = drawId ? { drawId } : { userId: person.id };
      await startChat(actions, { ...to, text: "Hey! We drew each other on Dcard today" });
    } catch (e) {
      toast(errorMessage(e));
    }
  };

  const onButton = () => {
    if (phase === "missed") toast("Your deck opens again at midnight");
    else if (phase === "ready" && view) drawDailyCard(pool).catch((e) => toast(errorMessage(e)));
  };

  const button =
    phase === "ready"
      ? { label: "Draw a card", inactive: false }
      : phase === "spinning"
        ? { label: "Dealing…", inactive: true }
        : phase === "missed"
          ? { label: "Locked until midnight", inactive: true }
          : null;

  const runDemo = (action: () => Promise<void>) => action().catch((e) => toast(errorMessage(e)));

  return (
    <SafeAreaView edges={["top", "bottom"]} style={styles.screen}>
      <ScreenHeader title="Daily card" onBack={() => goBack()} />

      <ScrollView contentContainerStyle={styles.body}>
        <View style={styles.intro}>
          <Text style={styles.title}>{copy.title}</Text>
          {view ? <Text style={styles.sub}>{copy.sub(view)}</Text> : <ActivityIndicator color={colors.brand} />}
        </View>

        <View style={styles.stage}>
          <Sticker name="sun" size={58} rotate={-8} style={styles.sun} />
          <Sticker name="koala" size={64} rotate={-14} style={styles.koala} />
          <View style={styles.card}>
            <Animated.View style={[styles.faceWrap, { transform: [{ perspective: 1200 }, { rotateY: frontTurn }] }]}>
              <CardFront />
            </Animated.View>
            <Animated.View style={[styles.faceWrap, { transform: [{ perspective: 1200 }, { rotateY: backTurn }] }]}>
              <CardBack person={view?.match ?? null} details={view?.details ?? null} />
            </Animated.View>
          </View>
          <View style={styles.oneADay}>
            <Text style={styles.oneADayText}>{phase === "matched" ? "G'day, mate!" : "1 a day!"}</Text>
          </View>
        </View>

        {phase === "matched" && view?.match && (
          <View style={styles.matched}>
            <Text style={styles.matchedText}>
              You&apos;re each other&apos;s card today. You both see nickname, major, uni, avatar, year, pronouns, bio &
              interests, and nothing else.
            </Text>
            <Button
              label="Send Message"
              icon={<Icon name="chat" size={18} color={colors.surface} strokeWidth={2.4} />}
              onPress={() => message(view.match!, view.drawId)}
              style={styles.fill}
            />
          </View>
        )}

        <View style={styles.clock}>
          <Text style={styles.clockLabel}>{copy.clockLabel}</Text>
          <Text style={[styles.clockValue, { color: copy.clockColor }]}>{view ? formatClock(remaining) : "--:--:--"}</Text>
        </View>

        <View style={styles.rules}>
          {RULES.map((rule, i) => (
            <View key={rule} style={styles.rule}>
              <View style={styles.ruleNumber}>
                <Text style={styles.ruleNumberText}>{i + 1}</Text>
              </View>
              <Text style={styles.ruleText}>{rule}</Text>
            </View>
          ))}
        </View>

        {/* The server allows it (DailyCard__DemoReset) or it's the device copy */}
        {view?.canReset && (
          <View style={styles.demo}>
            <Text style={styles.demoLabel}>DEMO</Text>
            <Button label="Reset today" size="sm" variant="outline" onPress={() => runDemo(demo.resetToday)} />
            <Button label="Simulate missed day" size="sm" variant="outline" onPress={() => runDemo(demo.missDay)} />
          </View>
        )}
      </ScrollView>

      {button && (
        <View style={styles.footer}>
          <Button
            label={button.label}
            variant="yellow"
            inactive={button.inactive}
            disabled={phase === "spinning" || !view}
            onPress={onButton}
          />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.canvas },
  body: { paddingHorizontal: 22, paddingTop: 18, paddingBottom: 24, alignItems: "center", gap: 20 },
  intro: { alignItems: "center", gap: 6 },
  title: { color: colors.ink, textAlign: "center", ...font(800, 28, 1.15, -0.02) },
  sub: { color: colors.muted, textAlign: "center", maxWidth: 320, ...font(500, 14.5, 1.5) },
  // Room around the card for its stickers
  stage: { width: "100%", alignItems: "center", paddingVertical: 8 },
  sun: { position: "absolute", top: -8, right: 0, zIndex: 3 },
  koala: { position: "absolute", left: -6, bottom: 40, zIndex: 3 },
  card: { width: 290, height: 410 },
  faceWrap: { ...StyleSheet.absoluteFill, backfaceVisibility: "hidden" },
  face: {
    flex: 1,
    borderRadius: 22,
    borderWidth: 3,
    borderColor: colors.ink,
    boxShadow: `0 6px 0 ${colors.ink}`,
    alignItems: "center",
    justifyContent: "center",
  },
  front: { backgroundColor: colors.yellow, overflow: "hidden" },
  frontFrame: {
    position: "absolute",
    top: 10,
    left: 10,
    right: 10,
    bottom: 10,
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: colors.ink,
    borderRadius: 14,
  },
  frontTag: {
    position: "absolute",
    bottom: 30,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.ink,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 4,
    transform: [{ rotate: "-4deg" }],
  },
  frontTagText: { color: colors.brand, ...font(800, 12, undefined, 0.16) },
  corner: { position: "absolute", color: colors.ink, ...font(800, 16) },
  cornerTop: { top: 16, left: 20 },
  cornerBottom: { top: 16, right: 20 },
  back: { backgroundColor: colors.surface, justifyContent: "flex-start", gap: 8, paddingHorizontal: 18, paddingTop: 28, paddingBottom: 18 },
  tape: {
    position: "absolute",
    top: -12,
    width: 74,
    height: 22,
    borderRadius: 4,
    backgroundColor: "rgba(244,183,64,0.75)",
    transform: [{ rotate: "-6deg" }],
  },
  nameRow: { flexDirection: "row", alignItems: "baseline", justifyContent: "center", gap: 6, maxWidth: "100%" },
  backNick: { flexShrink: 1, color: colors.ink, ...font(800, 22) },
  pronouns: { color: colors.faint, ...font(600, 12.5) },
  backMajor: { color: colors.body, textAlign: "center", ...font(600, 13.5) },
  pills: { flexDirection: "row", gap: 6 },
  year: { backgroundColor: colors.yellowSoft, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  yearText: { color: colors.yellowInk, ...font(700, 11.5) },
  bio: { color: colors.body, textAlign: "center", ...font(500, 13, 1.45) },
  interests: { alignSelf: "stretch", alignItems: "center", gap: 8, marginTop: 2 },
  dash: { alignSelf: "stretch", height: 0, borderTopWidth: 2, borderStyle: "dashed", borderColor: colors.lineLight },
  together: { color: colors.yellowInk, ...font(800, 12.5) },
  chips: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 6 },
  chip: {
    borderWidth: 1.5,
    borderColor: colors.lineLight,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  chipShared: { backgroundColor: colors.yellow, borderColor: colors.ink },
  chipText: { color: colors.body, ...font(700, 11.5) },
  chipSharedText: { color: colors.ink },
  backUni: { backgroundColor: colors.brandSoft, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  backUniText: { color: colors.brand, ...font(700, 11.5) },
  oneADay: {
    position: "absolute",
    right: 0,
    bottom: 14,
    zIndex: 3,
    backgroundColor: colors.coral,
    borderWidth: 3,
    borderColor: colors.surface,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 6,
    transform: [{ rotate: "8deg" }],
    boxShadow: "0 6px 14px rgba(20,20,43,0.25)",
  },
  oneADayText: { color: colors.surface, ...font(800, 14) },
  matched: {
    width: "100%",
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: 2.5,
    borderColor: colors.ink,
    boxShadow: `0 5px 0 ${colors.ink}`,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 18,
    alignItems: "center",
    gap: 12,
  },
  matchedText: { color: colors.muted, textAlign: "center", ...font(500, 13, 1.45) },
  fill: { alignSelf: "stretch" },
  clock: {
    width: "100%",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.yellowSoft,
    borderRadius: 18,
    borderWidth: 2.5,
    borderColor: colors.ink,
    boxShadow: `0 4px 0 ${colors.ink}`,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  clockLabel: { color: colors.yellowInk, textTransform: "uppercase", ...font(700, 12, undefined, 0.06) },
  clockValue: { fontVariant: ["tabular-nums"], ...font(800, 30, undefined, 0.04) },
  rules: { width: "100%", gap: 10 },
  rule: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  ruleNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.yellow,
    borderWidth: 2,
    borderColor: colors.ink,
    alignItems: "center",
    justifyContent: "center",
  },
  ruleNumberText: { color: colors.ink, ...font(800, 12) },
  ruleText: { flex: 1, color: colors.body, ...font(500, 13.5, 1.45) },
  demo: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", alignItems: "center", gap: 8 },
  demoLabel: { color: colors.faint, ...font(700, 11) },
  footer: { paddingHorizontal: 22, paddingTop: 10, paddingBottom: 14, backgroundColor: colors.canvas },
});
