import { router } from "expo-router";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as api from "@/api/endpoints";
import { useSubmit } from "@/api/hooks";
import { downloadPhoto, pickPhotos, uploadPhotos, type LocalPhoto } from "@/api/photos";
import type { RoomPhotoAnalysis } from "@/api/types";
import { useToast } from "@/components/feedback/Toast";
import {
  Button,
  ChipWrap,
  DateField,
  FieldLabel,
  PhotoDropzone,
  ScreenHeader,
  Segmented,
  Stepper,
  TextField,
} from "@/components/ui";
import type { MapPoint } from "@/data/types";
import AddressSearch from "@/features/forms/AddressSearch";
import AiPhotoPanel from "@/features/forms/AiPhotoPanel";
import { roomAutofill, toFurnishing } from "@/features/forms/aiAutofill";
import { photoKeysFor, roomForm } from "@/features/forms/prefill";
import { parseAuDate } from "@/lib/auDate";
import { useAddressSearch } from "@/features/forms/useAddressSearch";
import { useEditPrefill } from "@/features/forms/useEditPrefill";
import { usePhotoAnalysis } from "@/features/forms/usePhotoAnalysis";
import { MapDot, MiniMap } from "@/features/map";
import { selectMe, useAppStore } from "@/store";
import { colors, divider, font } from "@/theme";
import {
  EMPTY_ROOM,
  FEATURE_OPTIONS,
  flatRequest,
  MAX_ROOM_PHOTOS,
  RHYTHM_OPTIONS,
  roomProblem,
  type RoomDraft,
} from "./logic";
import { goBack } from "@/lib/goBack";

const DEMO_PHOTO = "https://images.unsplash.com/photo-1616594039964-ae9021a400a0?w=800&h=600&q=70&auto=format&fit=crop";
/** A little wider than the other forms (zoom 14): flats can be anywhere near the city */
const ROOM_REGION = { latitude: -34.9225, longitude: 138.602, latitudeDelta: 0.035, longitudeDelta: 0.032 };
const FURNISHED_LABEL = { Fully: "Fully furnished", Partly: "Partly furnished", Unfurnished: "Unfurnished" } as const;
/** The API takes 1–24 months, or nothing for flexible */
const MAX_STAY = 24;

const digits = (t: string) => t.replace(/\D/g, "");
const toggle = (list: string[], value: string) =>
  list.includes(value) ? list.filter((v) => v !== value) : [...list, value];

export default function ListRoomScreen() {
  const { state, actions } = useAppStore();
  const toast = useToast();
  const { busy, submit } = useSubmit();
  const [room, setRoom] = useState<RoomDraft>(EMPTY_ROOM);
  const [fromText, setFromText] = useState("");
  const [stayText, setStayText] = useState("");
  const [focus, setFocus] = useState<MapPoint | null>(null);
  // Editing: storage keys of the photos already on the room, and who lives there (sent back unchanged)
  const [photoKeys, setPhotoKeys] = useState<Record<string, string>>({});
  const [housemates, setHousemates] = useState<string[] | null>(null);
  const update = (patch: Partial<RoomDraft>) => setRoom((r) => ({ ...r, ...patch }));
  const { editId, editing, loading } = useEditPrefill(api.flats.get, (detail) => {
    const form = roomForm(detail);
    setRoom(form.draft);
    setFromText(form.fromText);
    setStayText(form.stayText);
    setPhotoKeys(form.keys);
    setHousemates(form.housemates);
    setFocus(form.draft.pin);
  });

  const analysis = usePhotoAnalysis(api.ai.analyseRoomPhoto, (a: RoomPhotoAnalysis) =>
    setRoom((r) => ({ ...r, ...roomAutofill(r, a) })),
  );
  // A typed address pins the flat and fills in the street and suburb it found
  const address = useAddressSearch((r) => {
    setRoom((room) => ({
      ...room,
      pin: { latitude: r.latitude, longitude: r.longitude },
      street: r.street ?? room.street,
      suburb: r.suburb ?? room.suburb,
    }));
    setFocus({ latitude: r.latitude, longitude: r.longitude });
  });

  const stay = stayText ? Number(stayText) : null;
  const fromInvalid = fromText.length === 10 && !parseAuDate(fromText);
  const problem = loading
    ? "Loading your room…"
    : stay !== null && (stay < 1 || stay > MAX_STAY)
      ? `Minimum stay is 1–${MAX_STAY} months`
      : fromText && !parseAuDate(fromText)
        ? "Enter the date as DD/MM/YYYY"
        : roomProblem(room);

  const addPhotos = (picked: LocalPhoto[]) => {
    if (!picked.length) return;
    // The first photo is the one the AI looks at (not when editing: the listing is already written)
    if (!room.photos.length && !editing) void analysis.run(picked[0].uri);
    setRoom((r) => ({ ...r, photos: [...r.photos, ...picked].slice(0, MAX_ROOM_PHOTOS) }));
  };

  const removePhoto = (i: number) => {
    const photos = room.photos.filter((_, j) => j !== i);
    update({ photos });
    if (i === 0 && !editing) {
      if (photos[0]) void analysis.run(photos[0].uri);
      else analysis.reset();
    }
  };

  const publish = () => {
    const pin = room.pin;
    if (problem || !pin) {
      toast(problem ?? "Pin your flat on the map");
      return;
    }
    void submit(async () => {
      if (editId) {
        // Photos already on the room keep their key; new ones are uploaded into its folder
        const keys = await photoKeysFor(room.photos, photoKeys, async (photo) => {
          const upload = await uploadPhotos([photo], (type) => api.uploads.flatPhoto(type, editId), () => editId);
          return upload.keys[0];
        });
        const request = flatRequest({ ...room, pin }, selectMe(state), editId, keys);
        await actions.updateFlat(editId, housemates ? { ...request, housemates } : request);
        toast("Room updated");
        goBack();
        return;
      }
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
      <ScreenHeader title={editing ? "Edit room" : "List a room"} onBack={() => goBack()} />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
          <PhotoDropzone
            photos={room.photos.map((p) => p.uri)}
            max={MAX_ROOM_PHOTOS}
            onAdd={() => submit(async () => addPhotos(await pickPhotos(MAX_ROOM_PHOTOS - room.photos.length)))}
            onRemove={removePhoto}
            onDemo={() => submit(async () => addPhotos([await downloadPhoto(DEMO_PHOTO)]))}
            emptyText="Upload room photo"
            aspectRatio={16 / 9}
          />
          <AiPhotoPanel<RoomPhotoAnalysis>
            state={analysis.state}
            onRetry={analysis.retry}
            facts={(a) => {
              const furnished = toFurnishing(a.furnished);
              return [
                ["Style", a.style],
                ["Colours", a.colours],
                ["Furnished", furnished ? FURNISHED_LABEL[furnished] : a.furnished],
                ["Features spotted", String(a.features.length)],
              ];
            }}
            benefits={(a) => a.benefits}
          />
          <TextField
            label="Listing title"
            value={room.title}
            onChangeText={(title) => update({ title })}
            placeholder="e.g. Bright room near North Tce"
          />
          <TextField
            label="Description"
            multiline
            rows={4}
            value={room.desc}
            onChangeText={(desc) => update({ desc })}
            placeholder="What's the room like? Upload a photo and AI will draft this."
            maxLength={1000}
          />

          <View style={styles.group}>
            <FieldLabel>Location — pin the flat on the map</FieldLabel>
            <AddressSearch search={address} placeholder="Type the flat address, e.g. 25 Frome St" />
            <MiniMap
              region={ROOM_REGION}
              height={220}
              focus={focus}
              label="Unknown address? Tap the map to pin it"
              onPressPoint={(pin) => {
                update({ pin });
                setFocus(null);
                address.mapTapped();
              }}
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
          <TextField
            label="Minimum stay"
            value={stayText}
            onChangeText={(t) => {
              // The API takes 1–24 months (blank = flexible)
              const months = digits(t).slice(0, 2);
              const text = months ? String(Math.min(24, Math.max(1, Number(months)))) : "";
              setStayText(text);
              update({ minStay: text ? Number(text) : null });
            }}
            placeholder="e.g. 6"
            keyboardType="number-pad"
            maxLength={2}
            suffix={stayText === "1" ? "month" : "months"}
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
            <FieldLabel>
              Features <Text style={styles.optional}>(optional)</Text>
            </FieldLabel>
            <ChipWrap
              options={FEATURE_OPTIONS.map((f) => ({
                label: f,
                active: room.feats.includes(f),
                onPress: () => update({ feats: toggle(room.feats, f) }),
              }))}
            />
          </View>
          <View style={styles.group}>
            <FieldLabel>
              House rhythm <Text style={styles.optional}>(optional)</Text>
            </FieldLabel>
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
          <DateField
            label="Available from"
            value={fromText}
            onChange={(text) => {
              setFromText(text);
              update({ from: parseAuDate(text) });
            }}
            error={fromInvalid ? "That date doesn't exist" : null}
          />
        </ScrollView>
        <View style={styles.footer}>
          <Button
            label={editing ? (busy ? "Saving…" : "Save changes") : busy ? "Publishing…" : "Publish room"}
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
  optional: { color: colors.faint, ...font(500, 13) },
  footer: { paddingHorizontal: 20, paddingVertical: 12, ...divider.top },
});
