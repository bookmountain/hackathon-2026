import { router } from "expo-router";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useToast } from "@/components/feedback/Toast";
import { Button, DateField, FieldLabel, Icon, PhotoDropzone, ScreenHeader, Segmented, TextField } from "@/components/ui";
import { PICKUPS } from "@/data/seed";
import { MapDot, MiniMap, PICKER_VIEWBOX } from "@/features/map";
import { useAppStore } from "@/store";
import { colors, font } from "@/theme";
import { buildItem, EMPTY_ITEM, itemProblem, type Availability, type ItemDraft } from "./logic";

export default function SellScreen() {
  const { actions } = useAppStore();
  const toast = useToast();
  const [draft, setDraft] = useState<ItemDraft>(EMPTY_ITEM);
  const update = (patch: Partial<ItemDraft>) => setDraft((d) => ({ ...d, ...patch }));
  const problem = itemProblem(draft);

  const post = () => {
    if (problem) {
      toast(problem);
      return;
    }
    const item = buildItem(draft, `m${Date.now()}`);
    actions.addItem(item);
    toast("Listed! Buyers can see it on the map.");
    router.dismissTo({ pathname: "/market", params: { posted: item.id } });
  };

  return (
    <SafeAreaView edges={["top", "bottom"]} style={styles.screen}>
      <ScreenHeader title="List an item" onBack={() => router.back()} />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
          <PhotoDropzone
            added={draft.photo}
            onPress={() => update({ photo: !draft.photo })}
            emptyText="Add product photo"
            addedText="1 photo added · tap to remove"
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
          />

          <View style={styles.group}>
            <FieldLabel>Availability</FieldLabel>
            <Segmented<Availability>
              value={draft.avail}
              onChange={(avail) => update({ avail })}
              options={[
                { value: "Available now", label: "Now" },
                { value: "Available from", label: "From date" },
                { value: "Pending", label: "Pending" },
              ]}
            />
            {draft.avail === "Available from" && (
              <DateField label="Available from" value={draft.from} onChange={(from) => update({ from })} />
            )}
          </View>

          <View style={styles.group}>
            <FieldLabel>Pickup — suggested safe spots</FieldLabel>
            {PICKUPS.map((p) => {
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
              viewBox={PICKER_VIEWBOX.wide}
              label="Or tap the map to drop your own pin"
              onPressPoint={(pin) => update({ pickup: "custom", pin })}
            >
              {PICKUPS.map((p) => (
                <MapDot
                  key={p.id}
                  x={p.x}
                  y={p.y}
                  halo={0}
                  radius={draft.pickup === p.id ? 8 : 5}
                  color={draft.pickup === p.id ? colors.ink : colors.brandMid}
                  strokeWidth={2}
                />
              ))}
              {draft.pin && <MapDot {...draft.pin} halo={14} radius={6} strokeWidth={2.5} />}
            </MiniMap>
          </View>
        </ScrollView>
        <View style={styles.footer}>
          <Button label="Post listing" onPress={post} inactive={problem !== null} />
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
