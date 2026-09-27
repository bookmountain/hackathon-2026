import { router, useLocalSearchParams } from "expo-router";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as api from "@/api/endpoints";
import { useLoad, useSubmit } from "@/api/hooks";
import { Avatar, BackButton, Button, Pill } from "@/components/ui";
import { toItemDetail } from "@/data/adapters";
import type { ItemDetail } from "@/data/types";
import { startChat } from "@/features/chat/startChat";
import { MapDot, MiniMap, regionAround } from "@/features/map";
import { LoadingScreen } from "@/features/shell/LoadingScreen";
import PhotoPager from "@/features/shell/PhotoPager";
import { useAppStore } from "@/store";
import { colors, divider, font } from "@/theme";
import { availabilityColors, isSold, openingMessage } from "./logic";

export default function ItemDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { state } = useAppStore();
  const { data, error, reload } = useLoad(() => api.items.get(id), id);
  if (!data) return <LoadingScreen error={error} onRetry={reload} />;
  return <ItemDetailView item={toItemDetail(data, state.pickups)} />;
}

function ItemDetailView({ item }: { item: ItemDetail }) {
  const { actions } = useAppStore();
  const { busy, submit } = useSubmit();
  const place = item.loc;
  const central = place.pickupId !== null;
  const { mine, seller } = item;
  const avail = availabilityColors(item.avail);
  const cta = mine ? "Your listing" : isSold(item) ? "Sold" : busy ? "Opening chat…" : "Message seller";

  // The server adds "About: {title} · ${price}" to the chat
  const message = () => {
    if (mine || isSold(item)) return;
    void submit(() => startChat(actions, { itemId: item.id, text: openingMessage(item) }));
  };

  return (
    <SafeAreaView edges={["top"]} style={styles.screen}>
      <ScrollView>
        <PhotoPager photos={item.photos} tone={item.tone} label="product photo" height={290}>
          <View style={styles.back}>
            <BackButton variant="white" onPress={() => router.back()} />
          </View>
        </PhotoPager>

        <View style={styles.body}>
          <View style={styles.headline}>
            <Text style={styles.price}>${item.price}</Text>
            <Text style={styles.title}>{item.title}</Text>
            <View style={styles.pills}>
              <Pill label={item.avail} bg={avail.bg} fg={avail.fg} size={12} weight={800} />
              <Pill label={item.cond} bg={colors.canvas} fg={colors.body} size={12} />
              <Pill label={item.posted} bg={colors.canvas} fg={colors.body} size={12} />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.desc}>{item.desc}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Pickup location</Text>
            <MiniMap
              region={regionAround(place)}
              footer={
                <View style={styles.placeInfo}>
                  <Text style={styles.placeName}>{place.name}</Text>
                  <Text style={[styles.placeSub, { color: central ? colors.brand : colors.muted }]}>
                    {central ? `Suggested safe pickup point · ${place.sub}` : "Seller's own pinned location"}
                  </Text>
                </View>
              }
            >
              <MapDot latitude={place.latitude} longitude={place.longitude} haloOpacity={0.18} size={12} strokeWidth={2.5} />
            </MiniMap>
          </View>

          <View style={styles.seller}>
            <Avatar index={seller.avatar} nick={seller.nick} url={seller.avatarUrl} look={seller.avatarStyle} size={42} />
            <View style={styles.sellerText}>
              <Text style={styles.sellerNick}>
                {seller.nick}
                {mine ? " (you)" : ""}
              </Text>
              <Text style={styles.sellerMeta} numberOfLines={1}>
                {seller.major} · {seller.uni}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <SafeAreaView edges={["bottom"]} style={styles.footer}>
        <Button label={cta} onPress={message} inactive={mine || isSold(item)} disabled={busy} />
      </SafeAreaView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surface },
  back: { position: "absolute", left: 14, top: 14 },
  body: { paddingHorizontal: 20, paddingTop: 18, paddingBottom: 20, gap: 18 },
  headline: { gap: 6 },
  price: { color: colors.ink, ...font(800, 30, undefined, -0.02) },
  title: { color: colors.ink, ...font(800, 19, 1.25) },
  pills: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 4 },
  section: { gap: 8 },
  sectionTitle: { color: colors.ink, ...font(800, 16) },
  desc: { color: colors.body, ...font(500, 14.5, 1.55) },
  placeInfo: { paddingHorizontal: 14, paddingVertical: 12, gap: 3 },
  placeName: { color: colors.ink, ...font(800, 14.5) },
  placeSub: { ...font(600, 12.5) },
  seller: { flexDirection: "row", alignItems: "center", gap: 12, padding: 12, backgroundColor: colors.canvas, borderRadius: 16 },
  sellerText: { flex: 1 },
  sellerNick: { color: colors.ink, ...font(800, 14.5) },
  sellerMeta: { color: colors.muted, ...font(500, 12.5) },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 12,
    ...divider.top,
    backgroundColor: colors.surface,
  },
});
