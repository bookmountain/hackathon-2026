import { router, useLocalSearchParams } from "expo-router";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Avatar, BackButton, Button, Pill, Striped } from "@/components/ui";
import { MapDot, MiniMap, regionAround } from "@/features/map";
import { startChat } from "@/features/chat/startChat";
import { findPerson, resolvePlace, selectMe, useAppStore } from "@/store";
import { colors, font } from "@/theme";
import { availabilityColors, isSold, openingMessage } from "./logic";

export default function ItemDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { state, actions } = useAppStore();
  const item = state.items.find((i) => i.id === id);
  if (!item) return null;

  const place = resolvePlace(item.loc);
  const mine = item.seller === "me";
  const seller = mine ? selectMe(state) : findPerson(item.seller);
  const avail = availabilityColors(item.avail);
  const cta = mine ? "Your listing" : isSold(item) ? "Sold" : "Message seller";

  const message = () => {
    if (mine || isSold(item)) return;
    startChat(actions, item.seller, "item", `About: ${item.title} · $${item.price}`, openingMessage(item));
  };

  return (
    <View style={styles.screen}>
      <ScrollView>
        <Striped tone={item.tone} stripe={14} label="product photo" style={styles.photo}>
          <SafeAreaView edges={["top"]} style={styles.back}>
            <BackButton variant="white" onPress={() => router.back()} />
          </SafeAreaView>
        </Striped>

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
                  <Text style={[styles.placeSub, { color: place.central ? colors.brand : colors.muted }]}>
                    {place.central ? `Suggested safe pickup point · ${place.sub}` : "Seller's own pinned location"}
                  </Text>
                </View>
              }
            >
              <MapDot latitude={place.latitude} longitude={place.longitude} haloOpacity={0.18} size={12} strokeWidth={2.5} />
            </MiniMap>
          </View>

          {seller && (
            <View style={styles.seller}>
              <Avatar index={seller.avatar} nick={seller.nick} size={42} />
              <View>
                <Text style={styles.sellerNick}>{seller.nick}</Text>
                <Text style={styles.sellerMeta}>
                  {seller.major} · {seller.uni}
                </Text>
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      <SafeAreaView edges={["bottom"]} style={styles.footer}>
        <Button label={cta} onPress={message} inactive={mine || isSold(item)} />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surface },
  photo: { height: 290 },
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
  sellerNick: { color: colors.ink, ...font(800, 14.5) },
  sellerMeta: { color: colors.muted, ...font(500, 12.5) },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 12,
    borderTopWidth: 1,
    borderTopColor: colors.lineSoft,
    backgroundColor: colors.surface,
  },
});
