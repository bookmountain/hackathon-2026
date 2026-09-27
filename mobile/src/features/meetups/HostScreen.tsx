import Slider from "@react-native-community/slider";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as api from "@/api/endpoints";
import { useSubmit } from "@/api/hooks";
import { useToast } from "@/components/feedback/Toast";
import { Button, DateField, FieldLabel, Icon, ScreenHeader, Segmented, Switch, TextField, TimeField } from "@/components/ui";
import { toEvent } from "@/data/adapters";
import type { EventCategory, MapPoint } from "@/data/types";
import AddressSearch from "@/features/forms/AddressSearch";
import { atTime, parseAuDate } from "@/lib/auDate";
import { useAddressSearch } from "@/features/forms/useAddressSearch";
import { CBD_REGION, MapDot, MiniMap } from "@/features/map";
import { useAppStore } from "@/store";
import { colors, divider, font } from "@/theme";
import { CAPACITY, EMPTY_EVENT, EVENT_CATEGORIES, eventProblem, eventRequest, type EventDraft } from "./logic";

const HOST_REGION = { ...CBD_REGION, latitude: -34.9215, longitude: 138.601 };

export default function HostScreen() {
  const { state, actions } = useAppStore();
  const toast = useToast();
  const { busy, submit } = useSubmit();
  const [draft, setDraft] = useState<EventDraft>(EMPTY_EVENT);
  const [dateText, setDateText] = useState("");
  const [time, setTime] = useState("");
  const [focus, setFocus] = useState<MapPoint | null>(null);
  const update = (patch: Partial<EventDraft>) => setDraft((d) => ({ ...d, ...patch }));
  const address = useAddressSearch((r) => {
    update({ where: "custom", pin: { latitude: r.latitude, longitude: r.longitude } });
    setFocus({ latitude: r.latitude, longitude: r.longitude });
  });

  // Date typed as DD/MM/YYYY plus a time (6pm when left blank)
  const day = parseAuDate(dateText);
  const when = day ? atTime(day, time) : null;
  const dateInvalid = dateText.length === 10 && !day;
  const problem = dateText && !day ? "Enter the date as DD/MM/YYYY" : eventProblem({ ...draft, when });
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
    if (problem || !when) {
      toast(problem ?? "Pick a date & time");
      return;
    }
    // An unnamed pin placed from a typed address is called by that address
    const place = draft.place.trim() || (focus ? address.text.trim() : "");
    void submit(async () => {
      const created = await api.events.create(eventRequest({ ...draft, place, when }));
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
          <View style={styles.group}>
            <FieldLabel>When</FieldLabel>
            <View style={styles.row}>
              <View style={styles.date}>
                <DateField value={dateText} onChange={setDateText} error={dateInvalid ? "That date doesn't exist" : null} />
              </View>
              <View style={styles.time}>
                <TimeField value={time} onChange={setTime} />
              </View>
            </View>
          </View>
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
            <FieldLabel>Or type the venue address</FieldLabel>
            <AddressSearch search={address} placeholder="e.g. 10 Rundle Mall" />
            <MiniMap
              region={HOST_REGION}
              height={220}
              focus={focus}
              label="Unknown address? Tap the map to pin it"
              onPressPoint={(pin) => {
                update({ where: "custom", pin });
                setFocus(null);
                address.mapTapped();
              }}
            >
              {state.pickups.map((p) => (
                <MapDot
                  key={p.id}
                  kind="dot"
                  latitude={p.latitude}
                  longitude={p.longitude}
                  selected={draft.where === p.id}
                  label={p.name}
                  onPress={() => update({ where: p.id })}
                />
              ))}
              {draft.where === "custom" && draft.pin && <MapDot kind="evpin" {...draft.pin} />}
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
              maximumTrackTintColor={colors.lineNeutral}
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
    borderColor: colors.lineNeutral,
    backgroundColor: colors.surface,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  placeActive: { borderColor: colors.brand, backgroundColor: colors.brandSoft },
  row: { flexDirection: "row", gap: 10 },
  date: { flex: 1.4 },
  time: { flex: 1 },
  placeName: { color: colors.ink, ...font(700, 14) },
  placeNote: { color: colors.muted, ...font(600, 12) },
  capacityRow: { flexDirection: "row", justifyContent: "space-between" },
  capacityValue: { color: colors.ink, ...font(700, 13) },
  toggles: { gap: 1, backgroundColor: colors.lineNeutral, borderRadius: 16, overflow: "hidden" },
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
  footer: { paddingHorizontal: 20, paddingVertical: 12, ...divider.top },
});
