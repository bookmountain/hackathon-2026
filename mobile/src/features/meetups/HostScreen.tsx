import Slider from "@react-native-community/slider";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as api from "@/api/endpoints";
import { useSubmit } from "@/api/hooks";
import { useToast } from "@/components/feedback/Toast";
import { Button, DateField, FieldLabel, Icon, ScreenHeader, Segmented, Switch, TextField } from "@/components/ui";
import { toEvent } from "@/data/adapters";
import type { EventCategory } from "@/data/types";
import { CBD_REGION, MapDot, MiniMap } from "@/features/map";
import { useAppStore } from "@/store";
import { colors, font } from "@/theme";
import { CAPACITY, EMPTY_EVENT, EVENT_CATEGORIES, eventProblem, eventRequest, type EventDraft } from "./logic";

export default function HostScreen() {
  const { state, actions } = useAppStore();
  const toast = useToast();
  const { busy, submit } = useSubmit();
  const [draft, setDraft] = useState<EventDraft>(EMPTY_EVENT);
  const update = (patch: Partial<EventDraft>) => setDraft((d) => ({ ...d, ...patch }));
  const problem = eventProblem(draft);
  const places = [
    ...state.pickups.map((p) => ({ id: p.id, name: p.name, note: "Central" })),
    { id: "custom", name: "Drop a pin on the map", note: "Any location" },
  ];

  // The preset places are the market's safe pickup points
  const needPickups = state.pickups.length === 0;
  useEffect(() => {
    if (needPickups) actions.loadPickups().catch(() => {});
  }, [needPickups, actions]);

  const publish = () => {
    const when = draft.when;
    if (problem || !when) {
      toast(problem ?? "Pick a date & time");
      return;
    }
    void submit(async () => {
      const created = await api.events.create(eventRequest({ ...draft, when }));
      actions.putEvent(toEvent(created.summary));
      toast("Published — your identity stays hidden");
      router.back();
    });
  };

  return (
    <SafeAreaView edges={["top", "bottom"]} style={styles.screen}>
      <ScreenHeader title="Host an event" onBack={() => router.back()} />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
          <TextField
            label="Event name"
            value={draft.title}
            onChangeText={(title) => update({ title })}
            placeholder="e.g. Friday coffee & code"
          />
          <View style={styles.group}>
            <FieldLabel>Type</FieldLabel>
            <Segmented<EventCategory>
              value={draft.cat}
              onChange={(cat) => update({ cat })}
              options={EVENT_CATEGORIES.map((c) => ({ value: c, label: c }))}
            />
          </View>
          <DateField
            label="When"
            mode="datetime"
            value={draft.when}
            onChange={(when) => update({ when })}
            placeholder="Pick a date & time"
          />
          <TextField
            label="What's the plan? (optional)"
            multiline
            value={draft.desc}
            onChangeText={(desc) => update({ desc })}
            placeholder="e.g. Bring your laptop, we'll grab a table near the windows"
            maxLength={1000}
          />

          <View style={styles.group}>
            <FieldLabel>Where</FieldLabel>
            {places.map((p) => {
              const active = draft.where === p.id;
              return (
                <Pressable
                  key={p.id}
                  onPress={() => update({ where: p.id })}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: active }}
                  style={[styles.place, active && styles.placeActive]}
                >
                  <Text style={styles.placeName}>{p.name}</Text>
                  <Text style={styles.placeNote}>{p.note}</Text>
                </Pressable>
              );
            })}
            <MiniMap
              region={CBD_REGION}
              aspectRatio={1}
              label="Tap to pin the exact spot"
              onPressPoint={(pin) => update({ where: "custom", pin })}
            >
              {state.pickups.map((p) => (
                <MapDot
                  key={p.id}
                  latitude={p.latitude}
                  longitude={p.longitude}
                  halo={0}
                  size={draft.where === p.id ? 16 : 10}
                  color={draft.where === p.id ? colors.ink : colors.brandMid}
                  strokeWidth={2}
                />
              ))}
              {draft.where === "custom" && draft.pin && <MapDot {...draft.pin} />}
            </MiniMap>
            {draft.where === "custom" && (
              <TextField
                value={draft.place}
                onChangeText={(place) => update({ place })}
                placeholder="Name this spot, e.g. Rymill Park lake"
              />
            )}
          </View>

          <View style={styles.group}>
            <View style={styles.capacityRow}>
              <FieldLabel>Capacity</FieldLabel>
              <Text style={styles.capacityValue}>{draft.cap} people</Text>
            </View>
            <Slider
              minimumValue={CAPACITY.min}
              maximumValue={CAPACITY.max}
              step={1}
              value={draft.cap}
              onValueChange={(cap) => update({ cap })}
              minimumTrackTintColor={colors.brand}
              maximumTrackTintColor={colors.line}
              thumbTintColor={Platform.OS === "android" ? colors.brand : undefined}
            />
          </View>

          <View style={styles.toggles}>
            <Pressable
              onPress={() => update({ walkIn: !draft.walkIn })}
              accessibilityRole="switch"
              accessibilityState={{ checked: draft.walkIn }}
              style={styles.toggle}
            >
              <View>
                <Text style={styles.toggleTitle}>Walk-ins welcome</Text>
                <Text style={styles.toggleSub}>No RSVP needed to turn up</Text>
              </View>
              <Switch on={draft.walkIn} />
            </Pressable>
            <View style={styles.toggle}>
              <View>
                <Text style={styles.toggleTitle}>Host anonymously</Text>
                <Text style={styles.toggleSub}>Always on — guests are hidden too</Text>
              </View>
              <Icon name="lock" color={colors.brand} />
            </View>
          </View>
        </ScrollView>
        <View style={styles.footer}>
          <Button
            label={busy ? "Publishing…" : "Publish event"}
            onPress={publish}
            inactive={problem !== null}
            disabled={busy}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surface },
  flex: { flex: 1 },
  body: { paddingHorizontal: 20, paddingVertical: 18, gap: 18 },
  group: { gap: 8 },
  place: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 2,
    borderColor: colors.lineSoft,
    backgroundColor: colors.surface,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  placeActive: { borderColor: colors.brand, backgroundColor: colors.brandSelected },
  placeName: { color: colors.ink, ...font(700, 14) },
  placeNote: { color: colors.muted, ...font(600, 12) },
  capacityRow: { flexDirection: "row", justifyContent: "space-between" },
  capacityValue: { color: colors.ink, ...font(700, 13) },
  toggles: { gap: 1, backgroundColor: colors.lineSoft, borderRadius: 16, overflow: "hidden" },
  toggle: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: colors.canvas,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  toggleTitle: { color: colors.ink, ...font(800, 14) },
  toggleSub: { color: colors.muted, ...font(500, 12) },
  footer: { paddingHorizontal: 20, paddingVertical: 12, borderTopWidth: 1, borderTopColor: colors.lineSoft },
});
