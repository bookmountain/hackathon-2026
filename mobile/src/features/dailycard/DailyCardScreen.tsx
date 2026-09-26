import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Animated, Easing, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Circle, G, Path } from "react-native-svg";
import { errorMessage } from "@/api/client";
import { useToast } from "@/components/feedback/Toast";
import { Avatar, Icon } from "@/components/ui";
import type { Person } from "@/data/types";
import { startChat } from "@/features/chat/startChat";
import { useAppStore } from "@/store";
import { brutal, colors, font } from "@/theme";
import { DEMO_STUDENTS, formatClock, isDemoStudent } from "./logic";
import { demo, drawDailyCard, loadDailyCard, refreshAfterClock, SHUFFLE_MS, useDailyCard } from "./useDailyCard";

const MISSED_CLOCK = "#FF8A80";
const RULES = [
  "One card a day. A fresh deck opens every midnight.",
  "You're matched with another student who drew today.",
  "Miss a day and the deck locks for 48 hours.",
];

type Phase = "ready" | "spinning" | "matched" | "missed";

const COPY: Record<Phase, { title: string; sub: (drawn: number) => string; clockLabel: string; clockColor: string }> = {
  ready: {
    title: "Draw your card",
    sub: (n) => `${n} students have drawn today. Flip a card to meet one of them.`,
    clockLabel: "Deck resets in",
    clockColor: colors.surface,
  },
  spinning: {
    title: "Shuffling the deck…",
    sub: () => "Dealing you a fellow student from Adelaide Uni & Flinders.",
    clockLabel: "Deck resets in",
    clockColor: colors.surface,
  },
  matched: {
    title: "Your card today",
    sub: () => "Say hi before midnight. Your next card opens tomorrow.",
    clockLabel: "Next draw in",
    clockColor: colors.yellow,
  },
  missed: {
    title: "Deck locked",
    sub: () => "You missed a day, so your deck is paused for 48 hours. Come back when the timer ends.",
    clockLabel: "Unlocks in",
    clockColor: MISSED_CLOCK,
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
    <LinearGradient
      colors={[colors.brand, colors.ink]}
      start={{ x: 0.25, y: 0 }}
      end={{ x: 0.75, y: 1 }}
      style={[styles.face, styles.front]}
    >
      <View style={styles.frontFrame} />
      <Svg width={88} height={88} viewBox="0 0 40 40">
        <Circle cx="20" cy="20" r="18" fill="none" stroke={colors.yellow} strokeWidth={1.5} />
        <G transform="rotate(35 20 20)">
          <Path d="M20 6l4.6 15h-9.2z" fill={colors.yellow} />
          <Path d="M20 34l-4.6-15h9.2z" fill={colors.surface} />
        </G>
        <Circle cx="20" cy="20" r="2.4" fill={colors.ink} stroke={colors.surface} strokeWidth={1.4} />
      </Svg>
      <Text style={styles.frontMark}>UCOMPASS</Text>
    </LinearGradient>
  );
}

function CardBack({ person }: { person: Person | null }) {
  return (
    <View style={[styles.face, styles.back]}>
      {person && (
        <>
          <Avatar index={person.avatar} nick={person.nick} url={person.avatarUrl} size={76} />
          <Text style={styles.backNick} numberOfLines={1}>
            {person.nick}
          </Text>
          {!!person.major && (
            <Text style={styles.backMajor} numberOfLines={2}>
              {person.major}
            </Text>
          )}
          <View style={styles.backUni}>
            <Text style={styles.backUniText}>{person.uni}</Text>
          </View>
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

  const message = async (person: Person) => {
    if (isDemoStudent(person)) {
      toast("This is a demo student, so there's no chat to open");
      return;
    }
    try {
      await startChat(actions, { userId: person.id, text: "Hey! We drew each other on Dcard today" });
    } catch (e) {
      toast(errorMessage(e));
    }
  };

  const onButton = () => {
    if (phase === "missed") toast("Your deck unlocks when the timer ends");
    else if (phase === "ready" && view) drawDailyCard(pool).catch((e) => toast(errorMessage(e)));
  };

  const button =
    phase === "ready"
      ? { label: "Draw a card", bg: colors.yellow, fg: colors.ink }
      : phase === "spinning"
        ? { label: "Dealing…", bg: "rgba(255,255,255,0.15)", fg: colors.brandLight }
        : phase === "missed"
          ? { label: "Locked", bg: "rgba(255,255,255,0.12)", fg: colors.faint }
          : null;

  return (
    <SafeAreaView edges={["top", "bottom"]} style={styles.screen}>
      <StatusBar style="light" />
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Back" style={styles.backBtn}>
          <Icon name="back" color={colors.surface} />
        </Pressable>
        <Text style={styles.headerTitle}>DAILY CARD</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        <View style={styles.intro}>
          <Text style={styles.title}>{copy.title}</Text>
          {view ? (
            <Text style={styles.sub}>{copy.sub(view.drawnToday)}</Text>
          ) : (
            <ActivityIndicator color={colors.brandLight} />
          )}
        </View>

        <View style={styles.card}>
          <Animated.View style={[styles.faceWrap, { transform: [{ perspective: 1200 }, { rotateY: frontTurn }] }]}>
            <CardFront />
          </Animated.View>
          <Animated.View style={[styles.faceWrap, { transform: [{ perspective: 1200 }, { rotateY: backTurn }] }]}>
            <CardBack person={view?.match ?? null} />
          </Animated.View>
        </View>

        {phase === "matched" && view?.match && (
          <View style={styles.matched}>
            <Text style={styles.matchedText}>You both drew a card today. Only nickname, major & uni are shared.</Text>
            <Pressable
              onPress={() => message(view.match!)}
              accessibilityRole="button"
              style={({ pressed }) => [styles.messageBtn, pressed && { backgroundColor: colors.brandPressed }]}
            >
              <Icon name="chat" size={18} color={colors.surface} strokeWidth={2.4} />
              <Text style={styles.messageText} numberOfLines={1}>
                Send a message to {view.match.nick}
              </Text>
            </Pressable>
          </View>
        )}

        <View style={styles.clock}>
          <Text style={styles.clockLabel}>{copy.clockLabel}</Text>
          <Text style={[styles.clockValue, { color: copy.clockColor }]}>{view ? formatClock(remaining) : "--:--:--"}</Text>
        </View>

        <View style={styles.rules}>
          {RULES.map((rule, i) => (
            <View key={rule} style={styles.rule}>
              <Text style={styles.ruleNumber}>{i + 1}</Text>
              <Text style={styles.ruleText}>{rule}</Text>
            </View>
          ))}
        </View>

        {card.mode === "local" && (
          <View style={styles.demo}>
            <Text style={styles.demoLabel}>DEMO</Text>
            <Pressable onPress={demo.resetToday} accessibilityRole="button" style={styles.demoBtn}>
              <Text style={styles.demoText}>Reset today</Text>
            </Pressable>
            <Pressable onPress={demo.missDay} accessibilityRole="button" style={styles.demoBtn}>
              <Text style={styles.demoText}>Simulate missed day</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>

      {button && (
        <View style={styles.footer}>
          <Pressable
            onPress={onButton}
            disabled={phase === "spinning" || !view}
            accessibilityRole="button"
            style={({ pressed }) => [
              styles.drawBtn,
              { backgroundColor: pressed && phase === "ready" ? colors.yellowPressed : button.bg },
              phase === "ready" && styles.drawGlow,
            ]}
          >
            <Text style={[styles.drawText, { color: button.fg }]}>{button.label}</Text>
          </Pressable>
        </View>
      )}
    </SafeAreaView>
  );
}

const CARD_SHADOW = "0 24px 50px -12px rgba(0,0,0,0.6)";

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.ink },
  header: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { color: colors.yellow, ...font(800, 13, undefined, 0.1) },
  headerSpacer: { width: 40 },
  body: { paddingHorizontal: 24, paddingTop: 8, paddingBottom: 20, alignItems: "center", gap: 20 },
  intro: { alignItems: "center", gap: 6 },
  title: { color: colors.surface, textAlign: "center", ...font(800, 28, 1.15, -0.02) },
  sub: { color: colors.brandLight, textAlign: "center", maxWidth: 300, ...font(500, 14.5, 1.5) },
  card: { width: 190, height: 270, marginVertical: 6 },
  faceWrap: { ...StyleSheet.absoluteFill, backfaceVisibility: "hidden" },
  face: { flex: 1, borderRadius: 22, borderWidth: 3, overflow: "hidden", boxShadow: CARD_SHADOW },
  front: { borderColor: colors.surface, alignItems: "center", justifyContent: "center" },
  frontFrame: {
    position: "absolute",
    top: 10,
    left: 10,
    right: 10,
    bottom: 10,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.25)",
    borderRadius: 16,
  },
  frontMark: { position: "absolute", bottom: 16, color: colors.yellow, ...font(800, 12, undefined, 0.22) },
  back: {
    backgroundColor: colors.surface,
    borderColor: colors.yellow,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    padding: 16,
  },
  backNick: { color: colors.ink, ...font(800, 19) },
  backMajor: { color: colors.body, textAlign: "center", ...font(600, 12.5) },
  backUni: { backgroundColor: colors.brandSoft, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  backUniText: { color: colors.brand, ...font(700, 11.5) },
  matched: {
    width: "100%",
    backgroundColor: colors.surface,
    borderRadius: 22,
    paddingHorizontal: 18,
    paddingVertical: 16,
    alignItems: "center",
    gap: 10,
  },
  matchedText: { color: colors.muted, textAlign: "center", ...font(500, 13, 1.45) },
  messageBtn: {
    width: "100%",
    height: 52,
    borderRadius: 16,
    backgroundColor: colors.brand,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 12,
    ...brutal(3),
  },
  messageText: { flexShrink: 1, color: colors.surface, ...font(800, 16) },
  clock: {
    width: "100%",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 18,
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  clockLabel: { color: colors.brandLight, textTransform: "uppercase", ...font(700, 12, undefined, 0.06) },
  clockValue: { fontVariant: ["tabular-nums"], ...font(800, 30, undefined, 0.04) },
  rules: { width: "100%", gap: 8 },
  rule: { flexDirection: "row", gap: 10 },
  ruleNumber: { color: colors.yellow, ...font(800, 13, 1.45) },
  ruleText: { flex: 1, color: colors.brandSofter, ...font(500, 13, 1.45) },
  demo: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", alignItems: "center", gap: 8 },
  demoLabel: { color: colors.faint, ...font(700, 11) },
  demoBtn: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  demoText: { color: colors.brandLight, ...font(700, 12) },
  footer: { paddingHorizontal: 24, paddingTop: 12, paddingBottom: 12 },
  drawBtn: { height: 58, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  drawGlow: { boxShadow: "0 10px 30px -8px rgba(255,201,64,0.55)" },
  drawText: { ...font(800, 17) },
});
