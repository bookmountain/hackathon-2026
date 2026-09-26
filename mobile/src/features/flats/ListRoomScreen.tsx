import { router } from "expo-router";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
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
import { CBD_REGION, MapDot, MiniMap } from "@/features/map";
import { selectMe, useAppStore } from "@/store";
import { colors } from "@/theme";
import { buildFlat, EMPTY_ROOM, FEATURE_OPTIONS, RHYTHM_OPTIONS, roomProblem, type RoomDraft } from "./logic";

const digits = (t: string) => t.replace(/\D/g, "");
const toggle = (list: string[], value: string) =>
  list.includes(value) ? list.filter((v) => v !== value) : [...list, value];

export default function ListRoomScreen() {
  const { state, actions } = useAppStore();
  const toast = useToast();
  const [room, setRoom] = useState<RoomDraft>(EMPTY_ROOM);
  const update = (patch: Partial<RoomDraft>) => setRoom((r) => ({ ...r, ...patch }));
  const problem = roomProblem(room);

  const publish = () => {
    if (problem || !room.pin) {
      toast(problem ?? "Pin your flat on the map");
      return;
    }
    const flat = buildFlat({ ...room, pin: room.pin }, selectMe(state), `f${Date.now()}`);
    actions.addFlat(flat);
    toast("Room published — it's on the map");
    // Back to the Flats map with the new room's card open
    router.dismissTo({ pathname: "/flats", params: { focus: flat.id } });
  };

  return (
    <SafeAreaView edges={["top", "bottom"]} style={styles.screen}>
      <ScreenHeader title="List a room" onBack={() => router.back()} />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
          <PhotoDropzone
            added={room.photo}
            onPress={() => update({ photo: !room.photo })}
            emptyText="Add room photos"
            addedText="3 room photos added · tap to remove"
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
            <TextField
              value={room.area}
              onChangeText={(area) => update({ area })}
              placeholder="Street / suburb, e.g. Frome St, Adelaide"
            />
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
                { value: "Private ensuite", label: "Private ensuite" },
                { value: "Shared toilet", label: "Shared toilet" },
              ]}
            />
          </View>
          <View style={styles.group}>
            <FieldLabel>Bathroom</FieldLabel>
            <Segmented
              value={room.bath}
              onChange={(bath) => update({ bath })}
              options={[
                { value: "Ensuite shower", label: "Ensuite" },
                { value: "Shared bathroom", label: "Shared" },
              ]}
            />
          </View>
          <TextField
            label="Minimum stay"
            value={room.minStay}
            onChangeText={(minStay) => update({ minStay })}
            placeholder="e.g. 3 months, or until end of semester"
          />
          <View style={styles.group}>
            <FieldLabel>Furnished</FieldLabel>
            <Segmented
              value={room.furnished}
              onChange={(furnished) => update({ furnished })}
              options={[
                { value: "Fully furnished", label: "Fully" },
                { value: "Partly furnished", label: "Partly" },
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
          <DateField label="Available from" value={room.from} onChange={(from) => update({ from })} placeholder="Available now" />
        </ScrollView>
        <View style={styles.footer}>
          <Button label="Publish room" onPress={publish} inactive={problem !== null} />
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
