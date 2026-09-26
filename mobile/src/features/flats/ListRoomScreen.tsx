import { router } from "expo-router";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as api from "@/api/endpoints";
import { useSubmit } from "@/api/hooks";
import { pickPhotos, uploadPhotos } from "@/api/photos";
import { useToast } from "@/components/feedback/Toast";
import {
  Button,
  ChipWrap,
  DateField,
  FieldLabel,
  PhotoDropzone,
  ScreenHeader,
  Segmented,
  SelectField,
  Stepper,
  TextField,
} from "@/components/ui";
import { CBD_REGION, MapDot, MiniMap } from "@/features/map";
import { selectMe, useAppStore } from "@/store";
import { colors } from "@/theme";
import {
  EMPTY_ROOM,
  FEATURE_OPTIONS,
  flatRequest,
  MAX_ROOM_PHOTOS,
  MIN_STAY_OPTIONS,
  RHYTHM_OPTIONS,
  roomProblem,
  type RoomDraft,
} from "./logic";

const digits = (t: string) => t.replace(/\D/g, "");
const toggle = (list: string[], value: string) =>
  list.includes(value) ? list.filter((v) => v !== value) : [...list, value];

export default function ListRoomScreen() {
  const { state, actions } = useAppStore();
  const toast = useToast();
  const { busy, submit } = useSubmit();
  const [room, setRoom] = useState<RoomDraft>(EMPTY_ROOM);
  const update = (patch: Partial<RoomDraft>) => setRoom((r) => ({ ...r, ...patch }));
  const problem = roomProblem(room);

  const addPhotos = () =>
    submit(async () => {
      const picked = await pickPhotos(MAX_ROOM_PHOTOS - room.photos.length);
      setRoom((r) => ({ ...r, photos: [...r.photos, ...picked].slice(0, MAX_ROOM_PHOTOS) }));
    });

  const publish = () => {
    const pin = room.pin;
    if (problem || !pin) {
      toast(problem ?? "Pin your flat on the map");
      return;
    }
    void submit(async () => {
      const { id, keys } = await uploadPhotos(room.photos, api.uploads.flatPhoto, (res) => res.listingId);
      const created = await api.flats.create(flatRequest({ ...room, pin }, selectMe(state), id, keys));
      await actions.loadFlats();
      toast("Room published — it's on the map");
      // Back to the Flats map with the new room's card open
      router.dismissTo({ pathname: "/flats", params: { focus: created.summary.id } });
    });
  };

  return (
    <SafeAreaView edges={["top", "bottom"]} style={styles.screen}>
      <ScreenHeader title="List a room" onBack={() => router.back()} />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
          <PhotoDropzone
            photos={room.photos.map((p) => p.uri)}
            max={MAX_ROOM_PHOTOS}
            onAdd={addPhotos}
            onRemove={(i) => update({ photos: room.photos.filter((_, j) => j !== i) })}
            emptyText="Add room photos"
          />
          <TextField
            label="Listing title"
            value={room.title}
            onChangeText={(title) => update({ title })}
            placeholder="e.g. Bright room near North Tce"
          />

          <View style={styles.group}>
            <FieldLabel>Location — pin the flat on the map</FieldLabel>
            <MiniMap
              region={CBD_REGION}
              aspectRatio={1}
              label="Tap to pin your flat · shown to students only"
              onPressPoint={(pin) => update({ pin })}
            >
              {room.pin && <MapDot {...room.pin} />}
            </MiniMap>
            <View style={styles.row}>
              <View style={styles.grow}>
                <TextField value={room.street} onChangeText={(street) => update({ street })} placeholder="Street, e.g. Frome St" />
              </View>
              <View style={styles.grow}>
                <TextField value={room.suburb} onChangeText={(suburb) => update({ suburb })} placeholder="Suburb, e.g. Adelaide" />
              </View>
            </View>
          </View>

          <View style={styles.row}>
            <View style={styles.grow}>
              <TextField
                label="Rent per week"
                prefix="$"
                value={room.price}
                onChangeText={(t) => update({ price: digits(t) })}
                placeholder="0"
                keyboardType="number-pad"
              />
            </View>
            <View style={styles.grow}>
              <TextField
                label="Bills per week"
                prefix="$"
                value={room.bills}
                onChangeText={(t) => update({ bills: digits(t) })}
                placeholder="0"
                keyboardType="number-pad"
              />
            </View>
          </View>

          <View style={styles.row}>
            <View style={[styles.grow, styles.group]}>
              <FieldLabel>Bedrooms</FieldLabel>
              <Stepper
                value={room.beds}
                onMinus={() => update({ beds: Math.max(1, room.beds - 1) })}
                onPlus={() => update({ beds: Math.min(8, room.beds + 1) })}
              />
            </View>
            <View style={[styles.grow, styles.group]}>
              <FieldLabel>Flatmates</FieldLabel>
              <Stepper
                value={room.members}
                onMinus={() => update({ members: Math.max(0, room.members - 1) })}
                onPlus={() => update({ members: Math.min(8, room.members + 1) })}
              />
            </View>
          </View>

          <View style={styles.group}>
            <FieldLabel>Toilet</FieldLabel>
            <Segmented
              value={room.toilet}
              onChange={(toilet) => update({ toilet })}
              options={[
                { value: "PrivateEnsuite", label: "Private ensuite" },
                { value: "Shared", label: "Shared toilet" },
              ]}
            />
          </View>
          <View style={styles.group}>
            <FieldLabel>Bathroom</FieldLabel>
            <Segmented
              value={room.bath}
              onChange={(bath) => update({ bath })}
              options={[
                { value: "Ensuite", label: "Ensuite" },
                { value: "Shared", label: "Shared" },
              ]}
            />
          </View>
          <SelectField
            label="Minimum stay"
            value={MIN_STAY_OPTIONS.find((o) => o.months === room.minStay)?.label ?? "Flexible"}
            options={MIN_STAY_OPTIONS.map((o) => o.label)}
            onChange={(label) => update({ minStay: MIN_STAY_OPTIONS.find((o) => o.label === label)?.months ?? null })}
          />
          <View style={styles.group}>
            <FieldLabel>Furnished</FieldLabel>
            <Segmented
              value={room.furnished}
              onChange={(furnished) => update({ furnished })}
              options={[
                { value: "Fully", label: "Fully" },
                { value: "Partly", label: "Partly" },
                { value: "Unfurnished", label: "None" },
              ]}
            />
          </View>
          <View style={styles.group}>
            <FieldLabel>Features</FieldLabel>
            <ChipWrap
              options={FEATURE_OPTIONS.map((f) => ({
                label: f,
                active: room.feats.includes(f),
                onPress: () => update({ feats: toggle(room.feats, f) }),
              }))}
            />
          </View>
          <View style={styles.group}>
            <FieldLabel>House rhythm</FieldLabel>
            <ChipWrap
              options={RHYTHM_OPTIONS.map((r) => ({
                label: r,
                active: room.rhythm.includes(r),
                onPress: () => update({ rhythm: toggle(room.rhythm, r) }),
              }))}
            />
          </View>
          <TextField
            label="Preferred flatmate"
            value={room.pref}
            onChangeText={(pref) => update({ pref })}
            placeholder="e.g. Quiet, non-smoker, any uni"
          />
          <TextField
            label="About the room (optional)"
            multiline
            value={room.desc}
            onChangeText={(desc) => update({ desc })}
            placeholder="Light, noise, what's nearby, who you're looking for"
            maxLength={1000}
          />
          <DateField label="Available from" value={room.from} onChange={(from) => update({ from })} placeholder="Available now" />
        </ScrollView>
        <View style={styles.footer}>
          <Button
            label={busy ? "Publishing…" : "Publish room"}
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
  row: { flexDirection: "row", gap: 10 },
  grow: { flex: 1 },
  footer: { paddingHorizontal: 20, paddingVertical: 12, borderTopWidth: 1, borderTopColor: colors.lineSoft },
});
