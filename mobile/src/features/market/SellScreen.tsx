import { router } from "expo-router";
import { useEffect, useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as api from "@/api/endpoints";
import { useSubmit } from "@/api/hooks";
import { downloadPhoto, pickPhotos, uploadPhotos, type LocalPhoto } from "@/api/photos";
import type { ItemAvailability, ItemPhotoAnalysis } from "@/api/types";
import { useToast } from "@/components/feedback/Toast";
import {
  Button,
  ChipWrap,
  DateField,
  FieldLabel,
  GamePressable,
  Icon,
  PhotoDropzone,
  ScreenHeader,
  Segmented,
  TextField,
} from "@/components/ui";
import type { MapPoint } from "@/data/types";
import AddressSearch from "@/features/forms/AddressSearch";
import AiPhotoPanel from "@/features/forms/AiPhotoPanel";
import { categoryLabel, conditionLabel, itemAutofill, toCategory, toCondition } from "@/features/forms/aiAutofill";
import { itemForm, photoKeysFor } from "@/features/forms/prefill";
import { parseAuDate } from "@/lib/auDate";
import { useAddressSearch } from "@/features/forms/useAddressSearch";
import { useEditPrefill } from "@/features/forms/useEditPrefill";
import { usePhotoAnalysis } from "@/features/forms/usePhotoAnalysis";
import { CBD_REGION, MapDot, MiniMap } from "@/features/map";
import { useAppStore } from "@/store";
import { colors, divider, font } from "@/theme";
import {
  CATEGORY_OPTIONS,
  CONDITION_OPTIONS,
  EMPTY_ITEM,
  itemProblem,
  itemRequest,
  MAX_ITEM_PHOTOS,
  type ItemDraft,
} from "./logic";
import { goBack } from "@/lib/goBack";

const DEMO_PHOTO = "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=640&h=640&q=70&auto=format&fit=crop";
const SELL_REGION = { ...CBD_REGION, latitude: -34.9205, longitude: 138.6005 };

export default function SellScreen() {
  const { state, actions } = useAppStore();
  const toast = useToast();
  const { busy, submit } = useSubmit();
  const [draft, setDraft] = useState<ItemDraft>(EMPTY_ITEM);
  const [fromText, setFromText] = useState("");
  const [focus, setFocus] = useState<MapPoint | null>(null);
  // Editing: storage keys of the photos already on the item, and whether it's sold
  const [photoKeys, setPhotoKeys] = useState<Record<string, string>>({});
  const [sold, setSold] = useState(false);
  const update = (patch: Partial<ItemDraft>) => setDraft((d) => ({ ...d, ...patch }));
  const { editId, editing, loading } = useEditPrefill(api.items.get, (detail) => {
    const form = itemForm(detail);
    setDraft(form.draft);
    setFromText(form.fromText);
    setPhotoKeys(form.keys);
    setSold(form.sold);
    setFocus(form.draft.pin);
  });

  const analysis = usePhotoAnalysis(api.ai.analyseItemPhoto, (a: ItemPhotoAnalysis) =>
    setDraft((d) => ({ ...d, ...itemAutofill(d, a) })),
  );
  const address = useAddressSearch((r) => {
    update({ pickup: "custom", pin: { latitude: r.latitude, longitude: r.longitude } });
    setFocus({ latitude: r.latitude, longitude: r.longitude });
  });

  // The suggested safe spots (loaded here too when Sell is opened before anything else needed them)
  const needPickups = state.pickups.length === 0;
  useEffect(() => {
    if (needPickups) actions.loadPickups().catch(() => {});
  }, [needPickups, actions]);

  const fromInvalid = fromText.length === 10 && !parseAuDate(fromText);
  const problem = loading
    ? "Loading your listing…"
    : !sold && draft.avail === "From" && fromText && !parseAuDate(fromText)
      ? "Enter the date as DD/MM/YYYY"
      : itemProblem(sold ? { ...draft, avail: "Now" } : draft);

  const addPhotos = (picked: LocalPhoto[]) => {
    if (!picked.length) return;
    // The first photo is the one the AI looks at (not when editing: the listing is already written)
    if (!draft.photos.length && !editing) void analysis.run(picked[0].uri);
    setDraft((d) => ({ ...d, photos: [...d.photos, ...picked].slice(0, MAX_ITEM_PHOTOS) }));
  };

  const removePhoto = (i: number) => {
    const photos = draft.photos.filter((_, j) => j !== i);
    update({ photos });
    if (i === 0 && !editing) {
      if (photos[0]) void analysis.run(photos[0].uri);
      else analysis.reset();
    }
  };

  const post = () => {
    if (problem) {
      toast(problem);
      return;
    }
    // An unnamed pin placed from a typed address is called by that address
    const placeName = (draft.placeName.trim() || (focus ? address.text.trim() : "")).slice(0, 64);
    void submit(async () => {
      if (editId) {
        // Photos already on the item keep their key; new ones are uploaded into its folder
        const keys = await photoKeysFor(draft.photos, photoKeys, async (photo) => {
          const upload = await uploadPhotos([photo], (type) => api.uploads.itemPhoto(type, editId), () => editId);
          return upload.keys[0];
        });
        const request = itemRequest({ ...draft, placeName }, editId, keys);
        await actions.updateItem(editId, sold ? { ...request, availability: "Sold", availableFrom: null } : request);
        toast("Listing updated");
        goBack();
        return;
      }
      const { id, keys } = await uploadPhotos(draft.photos, api.uploads.itemPhoto, (res) => res.itemId);
      if (!id) throw new Error("Add a photo first");
      const created = await api.items.create(itemRequest({ ...draft, placeName }, id, keys));
      await actions.loadItems();
      toast("Listed! Buyers can see it on the map.");
      router.dismissTo({ pathname: "/market", params: { posted: created.summary.id } });
    });
  };

  return (
    <SafeAreaView edges={["top", "bottom"]} style={styles.screen}>
      <ScreenHeader title={editing ? "Edit listing" : "List an item"} onBack={() => goBack()} />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
          <PhotoDropzone
            photos={draft.photos.map((p) => p.uri)}
            max={MAX_ITEM_PHOTOS}
            onAdd={() => submit(async () => addPhotos(await pickPhotos(MAX_ITEM_PHOTOS - draft.photos.length)))}
            onRemove={removePhoto}
            onDemo={() => submit(async () => addPhotos([await downloadPhoto(DEMO_PHOTO)]))}
            emptyText="Upload product photo"
            aspectRatio={1}
          />
          <AiPhotoPanel<ItemPhotoAnalysis>
            state={analysis.state}
            onRetry={analysis.retry}
            facts={(a) => [
              ["Category", categoryLabel(toCategory(a.category)) || a.category],
              ["Condition", conditionLabel(toCondition(a.condition)) || a.condition],
              ["Colour", a.colour],
              ["Texture", a.texture],
            ]}
            benefits={(a) => a.benefits}
            price={(a) => a.suggestedPrice}
            onUsePrice={(price) => update({ price: String(price) })}
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
            rows={6}
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
            {/* A sold item shows no segment picked, and stays Sold until you pick one */}
            <Segmented<ItemAvailability>
              value={sold ? "Sold" : draft.avail}
              onChange={(avail) => {
                setSold(false);
                if (avail !== "Sold") update({ avail });
              }}
              options={[
                { value: "Now", label: "Now" },
                { value: "From", label: "From date" },
                { value: "Pending", label: "Pending" },
              ]}
            />
            {!sold && draft.avail === "From" && (
              <DateField
                value={fromText}
                onChange={(text) => {
                  setFromText(text);
                  update({ from: parseAuDate(text) });
                }}
                error={fromInvalid ? "That date doesn't exist" : null}
              />
            )}
          </View>

          <View style={styles.group}>
            <FieldLabel>Pickup — suggested safe spots</FieldLabel>
            {state.pickups.map((p) => {
              const active = draft.pickup === p.id;
              return (
                <GamePressable
                  kind="row"
                  key={p.id}
                  onPress={() => update({ pickup: p.id, pin: null })}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: active }}
                  faceStyle={[styles.option, active && styles.optionActive]}
                >
                  <View style={[styles.optionIcon, { backgroundColor: active ? colors.ink : colors.brandSoft }]}>
                    <Icon name="star" size={16} color={active ? colors.yellow : colors.brand} />
                  </View>
                  <View style={styles.flex}>
                    <Text style={styles.optionName}>{p.name}</Text>
                    <Text style={styles.optionSub}>{p.sub}</Text>
                  </View>
                </GamePressable>
              );
            })}
            <AddressSearch search={address} placeholder="Or type a pickup address" />
            <MiniMap
              region={SELL_REGION}
              height={220}
              focus={focus}
              label="Unknown address? Tap the map to pin it"
              onPressPoint={(pin) => {
                update({ pickup: "custom", pin });
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
                  selected={draft.pickup === p.id}
                  label={p.name}
                  onPress={() => update({ pickup: p.id, pin: null })}
                />
              ))}
              {draft.pickup === "custom" && draft.pin && <MapDot {...draft.pin} />}
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
            label={editing ? (busy ? "Saving…" : "Save changes") : busy ? "Posting…" : "Post listing"}
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
    borderColor: colors.lineNeutral,
    backgroundColor: colors.surface,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 11,
  },
  optionActive: { borderColor: colors.brand, backgroundColor: colors.brandSoft },
  optionIcon: { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center" },
  optionName: { color: colors.ink, ...font(800, 14) },
  optionSub: { color: colors.muted, ...font(500, 12) },
  footer: { paddingHorizontal: 20, paddingVertical: 12, ...divider.top },
});
