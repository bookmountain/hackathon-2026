import { useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useToast } from "@/components/feedback/Toast";
import {
  AnonDots,
  Avatar,
  Button,
  Checkbox,
  ChipRow,
  DateField,
  Icon,
  Logo,
  PhotoDropzone,
  Pill,
  ScreenHeader,
  Segmented,
  SelectField,
  Stepper,
  Striped,
  Switch,
  TextField,
} from "@/components/ui";
import { colors, font } from "@/theme";

// Temporary UI kit gallery; replaced by the login flow in the onboarding commit
export default function UiKit() {
  const toast = useToast();
  const [view, setView] = useState<"map" | "list">("map");
  const [chips, setChips] = useState<string[]>(["Furnished"]);
  const [checked, setChecked] = useState(true);
  const [beds, setBeds] = useState(3);
  const [major, setMajor] = useState("");
  const [date, setDate] = useState<Date | null>(null);
  const [photo, setPhoto] = useState(false);

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenHeader title="UI kit" onBack={() => toast("Back pressed")} />
      <ScrollView contentContainerStyle={styles.body}>
        <View style={styles.row}>
          <Logo size={48} ring />
          <View style={styles.onBrand}>
            <Logo size={48} variant="onBrand" ring />
          </View>
          {[-1, 0, 1, 3].map((i) => (
            <Avatar key={i} index={i} nick="Koala_Kai" />
          ))}
          <AnonDots count={4} />
        </View>
        <View style={styles.row}>
          {(["back", "chat", "map", "list", "star", "tag", "house", "people", "search", "pin", "camera", "lock", "shield", "plus"] as const).map((n) => (
            <Icon key={n} name={n} color={colors.brand} />
          ))}
        </View>
        <Text style={font(800, 28, 1.15, -0.02)}>Before you start</Text>
        <Button label="Send verification code" onPress={() => toast("Welcome to UCompass, CompassRookie")} />
        <Button label="I agree & continue" inactive onPress={() => toast("Tick the required boxes")} />
        <View style={styles.row}>
          <Button label="View room" size="md" onPress={() => {}} style={styles.grow} />
          <Button label="Message tenant" size="md" variant="outline" weight={700} onPress={() => {}} style={styles.grow} />
        </View>
        <View style={styles.row}>
          <Button label="Going ✓" size="sm" variant="soft" onPress={() => {}} />
          <Button label="Host an event" size="sm" variant="yellow" onPress={() => {}} icon={<Icon name="plus" size={16} color={colors.ink} />} />
        </View>
        <Segmented
          size="compact"
          value={view}
          onChange={setView}
          options={[
            { value: "map", label: "Map", icon: (c) => <Icon name="map" size={14} color={c} /> },
            { value: "list", label: "List", icon: (c) => <Icon name="list" size={14} color={c} /> },
          ]}
        />
        <ChipRow
          inset={0}
          options={["Under $250", "Furnished", "Ensuite", "Bills < $30"].map((l) => ({
            label: l,
            active: chips.includes(l),
            onPress: () => setChips(chips.includes(l) ? chips.filter((c) => c !== l) : [...chips, l]),
          }))}
        />
        <View style={styles.row}>
          <Pill label="+$25 bills" />
          <Pill label="Pending" bg={colors.yellowSoft} fg={colors.yellowInk} />
          <Pill label="Quiet weeknights" dashed />
        </View>
        <Checkbox checked={checked} onPress={() => setChecked(!checked)} label="I'm 18+ and currently enrolled" note="(required)" />
        <View style={styles.row}>
          <Switch on={checked} />
          <View style={styles.grow}>
            <Stepper value={beds} onMinus={() => setBeds(beds - 1)} onPlus={() => setBeds(beds + 1)} />
          </View>
        </View>
        <TextField label="Title" placeholder="e.g. Chemistry textbook, 3rd ed." />
        <TextField label="Price" prefix="$" placeholder="0" keyboardType="number-pad" />
        <TextField label="Description" multiline placeholder="Condition, what's included" />
        <SelectField label="Major" value={major} placeholder="Select your major" options={["Computer Science", "Law", "Nursing"]} onChange={setMajor} />
        <DateField label="When" mode="datetime" value={date} onChange={setDate} placeholder="Pick a date & time" />
        <PhotoDropzone added={photo} onPress={() => setPhoto(!photo)} emptyText="Add product photo" addedText="1 photo added · tap to remove" />
        <Striped tone="#DCE6FF" label="room photo" style={styles.photo} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface },
  body: { padding: 20, gap: 16 },
  row: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 10 },
  grow: { flex: 1 },
  onBrand: { backgroundColor: colors.brand, padding: 6, borderRadius: 12 },
  photo: { height: 150, borderRadius: 22 },
});
