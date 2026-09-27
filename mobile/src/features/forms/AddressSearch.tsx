import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { Icon } from "@/components/ui";
import { colors, font } from "@/theme";
import type { AddressSearch as Search } from "./useAddressSearch";

type Props = { search: Search; placeholder: string };

// Address box that pins the map: "Finding…" while it looks up, other matches to pick, and how it went
export default function AddressSearch({ search, placeholder }: Props) {
  const { text, setText, results, selected, loading, status, pick } = search;
  return (
    <View style={styles.group}>
      <View>
        <View pointerEvents="none" style={styles.icon}>
          <Icon name="pinDot" size={18} color={colors.brand} />
        </View>
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder={placeholder}
          placeholderTextColor={colors.faint}
          autoCorrect={false}
          returnKeyType="search"
          style={styles.input}
        />
        {loading && (
          <View pointerEvents="none" style={styles.finding}>
            <ActivityIndicator size="small" color={colors.brand} />
            <Text style={styles.findingText}>Finding…</Text>
          </View>
        )}
      </View>
      {results.length > 1 && (
        <View style={styles.results}>
          {results.map((r, i) => {
            const active = i === selected;
            return (
              <Pressable
                key={`${r.latitude},${r.longitude},${i}`}
                onPress={() => pick(i)}
                accessibilityRole="radio"
                accessibilityState={{ selected: active }}
                style={[styles.result, active && styles.resultActive]}
              >
                <Icon name="pin" size={14} color={colors.muted} />
                <Text style={styles.resultText}>{r.name}</Text>
              </Pressable>
            );
          })}
        </View>
      )}
      {status && (
        <Text style={[styles.status, { color: status.tone === "ok" ? colors.success : colors.error }]}>{status.text}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  group: { gap: 8 },
  icon: { position: "absolute", left: 14, top: 0, bottom: 0, zIndex: 1, justifyContent: "center" },
  input: {
    height: 50,
    borderWidth: 2,
    borderColor: colors.line,
    borderRadius: 14,
    paddingLeft: 40,
    paddingRight: 96,
    backgroundColor: colors.surface,
    color: colors.ink,
    ...font(500, 15),
  },
  finding: { position: "absolute", right: 14, top: 0, bottom: 0, flexDirection: "row", alignItems: "center", gap: 6 },
  findingText: { color: colors.brand, ...font(700, 12) },
  results: { gap: 6 },
  result: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1.5,
    borderColor: colors.lineNeutral,
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  resultActive: { borderColor: colors.brand, backgroundColor: colors.brandSoft },
  resultText: { flex: 1, color: colors.ink, ...font(600, 13, 1.35) },
  status: { ...font(600, 12.5, 1.4) },
});
