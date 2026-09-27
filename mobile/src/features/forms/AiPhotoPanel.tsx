import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { Icon } from "@/components/ui";
import { colors, font } from "@/theme";
import type { AnalysisState } from "./usePhotoAnalysis";

type Props<T> = {
  state: AnalysisState<T>;
  /** Key/value tiles for a finished analysis, e.g. ["Colour", "White"] */
  facts: (result: T) => [string, string][];
  benefits: (result: T) => string[];
  /** Sell only: "Suggested student price" with "Use price" */
  price?: (result: T) => number;
  onUsePrice?: (price: number) => void;
  onRetry: () => void;
};

// "AI photo analysis" card under the photo: working, couldn't, or what it found
export default function AiPhotoPanel<T>({ state, facts, benefits, price, onUsePrice, onRetry }: Props<T>) {
  if (state.status === "idle") return null;
  return (
    <View style={styles.panel}>
      <View style={styles.header}>
        <Icon name="sparkle" size={18} color={colors.brand} />
        <Text style={styles.title}>AI photo analysis</Text>
        {state.status === "done" && (
          <Pressable onPress={onRetry} accessibilityRole="button" hitSlop={8}>
            <Text style={styles.link}>Re-analyse</Text>
          </Pressable>
        )}
      </View>

      {state.status === "loading" && (
        <View style={styles.row}>
          <ActivityIndicator size="small" color={colors.brand} />
          <Text style={styles.loading}>Looking at colour, material and condition…</Text>
        </View>
      )}

      {state.status === "error" && (
        <View style={styles.row}>
          <Text style={styles.error}>{state.message}</Text>
          {state.canRetry && (
            <Pressable onPress={onRetry} accessibilityRole="button" style={styles.retry}>
              <Text style={styles.retryText}>Retry</Text>
            </Pressable>
          )}
        </View>
      )}

      {state.status === "done" && (
        <>
          <View style={styles.grid}>
            {facts(state.result).map(([key, value]) => (
              <View key={key} style={styles.fact}>
                <Text style={styles.factKey}>{key}</Text>
                <Text style={styles.factValue} numberOfLines={1}>
                  {value}
                </Text>
              </View>
            ))}
          </View>
          {benefits(state.result).length > 0 && (
            <View style={styles.benefits}>
              <Text style={styles.benefitsTitle}>Why students will like it</Text>
              {benefits(state.result)
                .slice(0, 3)
                .map((b) => (
                  <View key={b} style={styles.benefit}>
                    <Icon name="check" size={14} color={colors.success} />
                    <Text style={styles.benefitText}>{b}</Text>
                  </View>
                ))}
            </View>
          )}
          {price && onUsePrice && (
            <View style={styles.price}>
              <View>
                <Text style={styles.factKey}>Suggested student price</Text>
                <Text style={styles.priceValue}>${Math.round(price(state.result))}</Text>
              </View>
              <Pressable
                onPress={() => onUsePrice(Math.round(price(state.result)))}
                accessibilityRole="button"
                style={({ pressed }) => [styles.usePrice, pressed && { backgroundColor: colors.brandPressed }]}
              >
                <Text style={styles.usePriceText}>Use price</Text>
              </Pressable>
            </View>
          )}
          <Text style={styles.footer}>Filled in the form for you. Edit anything before posting.</Text>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: colors.aiBorder,
    backgroundColor: colors.aiBg,
    padding: 14,
    gap: 12,
  },
  header: { flexDirection: "row", alignItems: "center", gap: 8 },
  title: { flex: 1, color: colors.brand, ...font(800, 14) },
  link: { color: colors.brand, ...font(700, 12.5) },
  row: { flexDirection: "row", alignItems: "center", gap: 10 },
  loading: { flex: 1, color: colors.body, ...font(600, 13) },
  error: { flex: 1, color: colors.error, ...font(600, 13, 1.4) },
  retry: { backgroundColor: colors.surface, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 },
  retryText: { color: colors.brand, ...font(700, 12) },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  fact: { width: "48.5%", backgroundColor: colors.surface, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 8, gap: 2 },
  factKey: { color: colors.muted, ...font(600, 11) },
  factValue: { color: colors.ink, ...font(800, 13) },
  benefits: { gap: 6 },
  benefitsTitle: { color: colors.muted, ...font(700, 12) },
  benefit: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  benefitText: { flex: 1, color: colors.body, ...font(500, 13, 1.4) },
  price: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  priceValue: { color: colors.ink, ...font(800, 17) },
  usePrice: { backgroundColor: colors.brand, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 },
  usePriceText: { color: colors.surface, ...font(700, 12.5) },
  footer: { color: colors.success, ...font(600, 12) },
});
