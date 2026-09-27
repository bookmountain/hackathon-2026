import { router, type Href } from "expo-router";
import { useCallback, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { useRefreshOnFocus, useSubmit } from "@/api/hooks";
import { useToast } from "@/components/feedback/Toast";
import { GamePressable, Icon, Photo } from "@/components/ui";
import { useAppStore } from "@/store";
import { colors, font } from "@/theme";
import { countLabel, deletedToast, eventRow, flatRow, itemRow, type ActivityKind, type ActivityRow } from "./activityRows";

const DETAIL: Record<ActivityKind, (id: string) => Href> = {
  event: (id) => `/meetups/${id}`,
  flat: (id) => `/flats/${id}`,
  item: (id) => `/market/${id}`,
};
const FORM = { event: "/meetups/new", flat: "/flats/new", item: "/market/new" } as const;

// Soft red of the delete buttons, no theme token
const DANGER_SOFT = "#FFF5F5";

// Profile's "My activity": meetups you host or joined, your rooms and your market
// listings, each with Edit and Delete (or Leave) behind an inline confirm
export default function MyActivity() {
  const { state, actions } = useAppStore();
  const toast = useToast();
  const { busy, submit } = useSubmit();
  // "event:id" of the row showing its red confirm button
  const [confirming, setConfirming] = useState<string | null>(null);
  useRefreshOnFocus(useCallback(() => actions.loadMine(), [actions]));

  const mine = state.mine;
  const keyOf = (row: ActivityRow) => `${row.kind}:${row.id}`;

  const remove = (row: ActivityRow) =>
    void submit(async () => {
      if (row.kind === "event") {
        if (row.deleteLabel === "Leave") await actions.leaveEvent(row.id);
        else await actions.deleteEvent(row.id);
      } else if (row.kind === "flat") {
        await actions.deleteFlat(row.id);
      } else {
        await actions.deleteItem(row.id);
      }
      setConfirming(null);
      toast(deletedToast(row));
    });

  const renderRow = (row: ActivityRow) => {
    const key = keyOf(row);
    const open = () => router.push(DETAIL[row.kind](row.id));
    return (
      <View key={key} style={styles.row}>
        <Pressable onPress={open} accessibilityRole="imagebutton" accessibilityLabel={row.title}>
          <Photo uri={row.photo} tone={colors.brandSofter} stripe={8} style={styles.thumb} />
        </Pressable>
        <Pressable onPress={open} accessibilityRole="button" style={styles.rowText}>
          <Text style={styles.rowTitle} numberOfLines={1}>
            {row.title}
          </Text>
          <Text style={styles.rowSub} numberOfLines={1}>
            {row.sub}
          </Text>
          <Text style={[styles.tag, { color: row.tagFg, backgroundColor: row.tagBg }]}>{row.tag}</Text>
        </Pressable>
        {confirming === key ? (
          <View style={styles.confirm}>
            <Pressable
              onPress={() => remove(row)}
              disabled={busy}
              accessibilityRole="button"
              style={({ pressed }) => [styles.confirmButton, (pressed || busy) && styles.pressed]}
            >
              <Text style={styles.confirmText}>{row.deleteLabel}</Text>
            </Pressable>
            <Pressable onPress={() => setConfirming(null)} accessibilityRole="button" style={styles.cancel}>
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.actions}>
            {row.canEdit && (
              <GamePressable
                kind="sm"
                onPress={() => {
                  setConfirming(null);
                  router.push({ pathname: FORM[row.kind], params: { editId: row.id, from: "profile" } });
                }}
                accessibilityRole="button"
                accessibilityLabel="Edit"
                faceStyle={[styles.iconButton, styles.edit]}
              >
                <Icon name="pencil" size={16} color={colors.brand} />
              </GamePressable>
            )}
            <GamePressable
              kind="sm"
              onPress={() => setConfirming(key)}
              accessibilityRole="button"
              accessibilityLabel={row.deleteLabel}
              faceStyle={[styles.iconButton, styles.delete]}
            >
              <Icon name="trash" size={16} color={colors.danger} />
            </GamePressable>
          </View>
        )}
      </View>
    );
  };

  const section = (title: string, add: string, href: Href, rows: ActivityRow[], empty: string) => (
    <View style={styles.section}>
      <View style={styles.sectionHead}>
        <Text style={styles.sectionTitle}>
          {title} <Text style={styles.count}>{countLabel(rows.length)}</Text>
        </Text>
        <Pressable onPress={() => router.push(href)} accessibilityRole="button" hitSlop={8}>
          <Text style={styles.add}>{add}</Text>
        </Pressable>
      </View>
      {rows.map(renderRow)}
      {!rows.length && (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>{empty}</Text>
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.wrap}>
      <Text style={styles.heading}>My activity</Text>
      {mine ? (
        <>
          {section("Meetups", "+ Host", "/meetups/new", mine.events.map(eventRow), "No meetups yet. Join or host one.")}
          {section("Rooms", "+ List a room", "/flats/new", mine.flats.map(flatRow), "You haven't listed a room.")}
          {section("Market listings", "+ Sell", "/market/new", mine.items.map(itemRow), "Nothing for sale yet.")}
        </>
      ) : (
        <ActivityIndicator color={colors.brand} style={styles.loading} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 18 },
  heading: { color: colors.ink, ...font(800, 20) },
  loading: { paddingVertical: 20 },
  section: { gap: 10 },
  sectionHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "baseline" },
  sectionTitle: { color: colors.ink, ...font(800, 16) },
  count: { color: colors.faint, ...font(700, 13) },
  add: { color: colors.brand, ...font(700, 13) },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.lineLight,
    borderRadius: 16,
    padding: 10,
  },
  thumb: { width: 56, height: 56, borderRadius: 12 },
  rowText: { flex: 1, minWidth: 0, gap: 2, alignItems: "flex-start" },
  rowTitle: { alignSelf: "stretch", color: colors.ink, ...font(800, 14) },
  rowSub: { alignSelf: "stretch", color: colors.muted, ...font(600, 12) },
  tag: { borderRadius: 999, overflow: "hidden", paddingHorizontal: 8, paddingVertical: 3, ...font(700, 11) },
  actions: { flexDirection: "row", gap: 6 },
  // Game "sm" buttons: GamePressable draws the ink border and ledge
  iconButton: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  edit: { backgroundColor: colors.surface },
  delete: { backgroundColor: DANGER_SOFT },
  pressed: { opacity: 0.7 },
  confirm: { gap: 4, alignItems: "stretch" },
  confirmButton: {
    height: 30,
    paddingHorizontal: 10,
    borderRadius: 9,
    backgroundColor: colors.danger,
    alignItems: "center",
    justifyContent: "center",
  },
  confirmText: { color: colors.surface, ...font(700, 12) },
  cancel: { height: 26, alignItems: "center", justifyContent: "center" },
  cancelText: { color: colors.muted, ...font(700, 12) },
  empty: { borderWidth: 1.5, borderStyle: "dashed", borderColor: colors.lineLight, borderRadius: 14, padding: 14 },
  emptyText: { color: colors.faint, textAlign: "center", ...font(600, 13) },
});
