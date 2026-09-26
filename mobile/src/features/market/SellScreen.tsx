import { router } from "expo-router";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
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
  Icon,
  PhotoDropzone,
  ScreenHeader,
  Segmented,
  TextField,
} from "@/components/ui";
import { CBD_REGION, MapDot, MiniMap } from "@/features/map";
import { useAppStore } from "@/store";
import { colors, font } from "@/theme";
import {
  CATEGORY_OPTIONS,
  CONDITION_OPTIONS,
  EMPTY_ITEM,
  itemProblem,
  itemRequest,
  MAX_ITEM_PHOTOS,
  type Availability,
  type ItemDraft,
} from "./logic";

export default function SellScreen() {
  const { state, actions } = useAppStore();
  const toast = useToast();
  const { busy, submit } = useSubmit();
  const [draft, setDraft] = useState<ItemDraft>(EMPTY_ITEM);
  const update = (patch: Partial<ItemDraft>) => setDraft((d) => ({ ...d, ...patch }));
  const problem = itemProblem(draft);

  const addPhotos = () =>
    submit(async () => {
      const picked = await pickPhotos(MAX_ITEM_PHOTOS - draft.photos.length);
      setDraft((d) => ({ ...d, photos: [...d.photos, ...picked].slice(0, MAX_ITEM_PHOTOS) }));
    });

  const post = () => {
    if (problem) {
      toast(problem);
      return;
    }
    void submit(async () => {
      const { id, keys } = await uploadPhotos(draft.photos, api.uploads.itemPhoto, (res) => res.itemId);
      if (!id) throw new Error("Add a photo first");
      const created = await api.items.create(itemRequest(draft, id, keys));
      await actions.loadItems();
      toast("Listed! Buyers can see it on the map.");
      router.dismissTo({ pathname: "/market", params: { posted: created.summary.id } });
    });
  };

  return (
    <SafeAreaView edges={["top", "bottom"]} style={styles.screen}>
      <ScreenHeader title="List an item" onBack={() => router.back()} />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
          <PhotoDropzone
            photos={draft.photos.map((p) => p.uri)}
            max={MAX_ITEM_PHOTOS}
            onAdd={addPhotos}
            onRemove={(i) => update({ photos: draft.photos.filter((_, j) => j !== i) })}
            emptyText="Add product photo"
          />
          <TextField
            label="Title"
            value={draft.title}
            onChangeText={(title) => update({ title })}
            placeholder="e.g. Chemistry textbook, 3rd ed."
          />
          <TextField
            label="Price"
            prefix="$"
            value={draft.price}
            onChangeText={(t) => update({ price: t.replace(/\D/g, "") })}
            placeholder="0"
            keyboardType="number-pad"
          />
          <TextField
            label="Description"
            multiline
            value={draft.desc}
            onChangeText={(desc) => update({ desc })}
            placeholder="Condition, what's included, when you're free to meet"
            maxLength={1000}
          />

          <View style={styles.group}>
            <FieldLabel>Category</FieldLabel>
            <ChipWrap
              options={CATEGORY_OPTIONS.map((c) => ({
                label: c.label,
                active: draft.category === c.value,
                onPress: () => update({ category: c.value }),
              }))}
            />
          </View>
          <View style={styles.group}>
            <FieldLabel>Condition</FieldLabel>
            <ChipWrap
              options={CONDITION_OPTIONS.map((c) => ({
                label: c.label,
                active: draft.condition === c.value,
                onPress: () => update({ condition: c.value }),
              }))}
            />
          </View>

          <View style={styles.group}>
            <FieldLabel>Availability</FieldLabel>
            <Segmented<Availability>
              value={draft.avail}
              onChange={(avail) => update({ avail })}
              options={[
                { value: "Now", label: "Now" },
                { value: "From", label: "From date" },
                { value: "Pending", label: "Pending" },
              ]}
            />
            {draft.avail === "From" && (
              <DateField label="Available from" value={draft.from} onChange={(from) => update({ from })} />
            )}
          </View>

          <View style={styles.group}>
            <FieldLabel>Pickup — suggested safe spots</FieldLabel>
            {state.pickups.map((p) => {
              const active = draft.pickup === p.id;
              return (
                <Pressable
                  key={p.id}
                  onPress={() => update({ pickup: p.id, pin: null })}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: active }}
                  style={[styles.option, active && styles.optionActive]}
                >
                  <View style={[styles.optionIcon, { backgroundColor: active ? colors.ink : colors.brandSoft }]}>
                    <Icon name="star" size={16} color={active ? colors.yellow : colors.brand} />
                  </View>
                  <View style={styles.flex}>
                    <Text style={styles.optionName}>{p.name}</Text>
                    <Text style={styles.optionSub}>{p.sub}</Text>
                  </View>
                </Pressable>
              );
            })}
            <MiniMap
              region={CBD_REGION}
              aspectRatio={1.7}
              label="Or tap the map to drop your own pin"
              onPressPoint={(pin) => update({ pickup: "custom", pin })}
            >
              {state.pickups.map((p) => (
                <MapDot
                  key={p.id}
                  latitude={p.latitude}
                  longitude={p.longitude}
                  halo={0}
                  size={draft.pickup === p.id ? 16 : 10}
                  color={draft.pickup === p.id ? colors.ink : colors.brandMid}
                  strokeWidth={2}
                />
              ))}
              {draft.pin && <MapDot {...draft.pin} halo={28} size={12} strokeWidth={2.5} />}
            </MiniMap>
            {draft.pickup === "custom" && (
              <TextField
                value={draft.placeName}
                onChangeText={(placeName) => update({ placeName })}
                placeholder="Name this spot (optional), e.g. Rundle St East"
                maxLength={64}
              />
            )}
          </View>
        </ScrollView>
        <View style={styles.footer}>
          <Button
            label={busy ? "Posting…" : "Post listing"}
            onPress={post}
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
  option: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 2,
    borderColor: colors.lineSoft,
    backgroundColor: colors.surface,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 11,
  },
  optionActive: { borderColor: colors.brand, backgroundColor: colors.brandSelected },
  optionIcon: { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center" },
  optionName: { color: colors.ink, ...font(800, 14) },
  optionSub: { color: colors.muted, ...font(500, 12) },
  footer: { paddingHorizontal: 20, paddingVertical: 12, borderTopWidth: 1, borderTopColor: colors.lineSoft },
});
