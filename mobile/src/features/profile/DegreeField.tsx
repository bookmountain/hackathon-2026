import { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Modal, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { errorMessage } from "@/api/client";
import * as api from "@/api/endpoints";
import type { Degree, University } from "@/api/types";
import { FieldLabel, Icon } from "@/components/ui";
import { colors, font } from "@/theme";

/** Wait for a pause in typing before searching */
const SEARCH_DELAY_MS = 250;

type Props = {
  university: University;
  value: { id: number; name: string } | null;
  onChange: (degree: Degree) => void;
};

// "Major": the API needs a real degree, so this is a type-ahead over GET /api/degrees
export default function DegreeField({ university, value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Degree[] | null>(null);
  const [error, setError] = useState("");
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (!open) return;
    let active = true;
    const timer = setTimeout(() => {
      api.degrees.search(university, query).then(
        (degrees) => {
          if (!active) return;
          setResults(degrees);
          setError("");
        },
        (e) => active && setError(errorMessage(e)),
      );
    }, SEARCH_DELAY_MS);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [open, query, university]);

  return (
    <View style={styles.group}>
      <FieldLabel>Major</FieldLabel>
      <Pressable onPress={() => setOpen(true)} accessibilityRole="button" style={styles.field}>
        <Text style={[styles.value, !value && { color: colors.faint }]} numberOfLines={1}>
          {value?.name ?? "Search for your degree"}
        </Text>
        <Icon name="chevronDown" size={18} color={colors.muted} />
      </Pressable>

      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)} />
        <View style={[styles.sheet, { paddingBottom: insets.bottom + 12 }]}>
          <Text style={styles.sheetTitle}>Your degree</Text>
          <View style={styles.search}>
            <Icon name="search" size={18} color={colors.faint} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="e.g. Computer Science, Nursing, Law"
              placeholderTextColor={colors.faint}
              autoCorrect={false}
              autoFocus
              style={styles.searchInput}
            />
          </View>
          {error ? <Text style={styles.note}>{error}</Text> : null}
          {!results && !error ? <ActivityIndicator color={colors.brand} style={styles.loading} /> : null}
          <FlatList
            data={results ?? []}
            keyExtractor={(d) => String(d.id)}
            keyboardShouldPersistTaps="handled"
            ListEmptyComponent={results ? <Text style={styles.note}>No degrees match “{query}”.</Text> : null}
            renderItem={({ item }) => {
              const selected = item.id === value?.id;
              return (
                <Pressable
                  onPress={() => {
                    onChange(item);
                    setOpen(false);
                  }}
                  style={[styles.option, selected && styles.optionSelected]}
                >
                  <View style={styles.optionText}>
                    <Text style={[styles.optionName, selected && { color: colors.brand }]}>{item.name}</Text>
                    <Text style={styles.optionMeta}>{item.level}</Text>
                  </View>
                  {selected && <Icon name="check" size={16} color={colors.brand} />}
                </Pressable>
              );
            }}
          />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  group: { gap: 8 },
  field: {
    height: 52,
    borderWidth: 1.5,
    borderColor: colors.line,
    borderRadius: 14,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    backgroundColor: colors.surface,
  },
  value: { flex: 1, color: colors.ink, ...font(600, 15) },
  backdrop: { flex: 1, backgroundColor: "rgba(10,26,63,0.3)" },
  sheet: {
    height: "80%",
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 18,
    paddingHorizontal: 12,
    gap: 10,
  },
  sheetTitle: { color: colors.ink, paddingHorizontal: 8, ...font(800, 17) },
  search: {
    height: 46,
    marginHorizontal: 4,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.line,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
  },
  searchInput: { flex: 1, height: "100%", color: colors.ink, ...font(500, 14.5) },
  loading: { paddingVertical: 20 },
  note: { color: colors.muted, textAlign: "center", paddingVertical: 20, ...font(600, 13.5) },
  option: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 12,
  },
  optionSelected: { backgroundColor: colors.brandSoft },
  optionText: { flex: 1, gap: 2 },
  optionName: { color: colors.ink, ...font(600, 14.5) },
  optionMeta: { color: colors.muted, ...font(500, 12) },
});
