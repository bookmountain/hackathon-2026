import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import type { AvatarIcon, AvatarMode, AvatarRing, AvatarShape, AvatarStyle } from "@/api/types";
import { colors, font } from "@/theme";
import { AVATAR_COLORS, AVATAR_ICONS, AVATAR_RINGS } from "./Avatar";
import Icon from "./Icon";
import Segmented from "./Segmented";

type Show = AvatarMode | "Anonymous";

const ICON_KEYS = Object.keys(AVATAR_ICONS) as AvatarIcon[];
const RING_KEYS = Object.keys(AVATAR_RINGS) as AvatarRing[];
const SHAPE_KEYS: AvatarShape[] = ["Circle", "Soft", "Square"];
const SELECTED_RING = `0 0 0 3px ${colors.canvas}, 0 0 0 5px ${colors.brand}`;

const pick = <T,>(list: readonly T[]): T => list[Math.floor(Math.random() * list.length)];

/** Random colour, look, icon, shape and ring (icons twice as likely as initials) */
export function surpriseAvatar(current: AvatarStyle): { preset: number; style: AvatarStyle } {
  return {
    preset: Math.floor(Math.random() * AVATAR_COLORS.length),
    style: {
      ...current,
      mode: pick<AvatarMode>(["Initials", "Icon", "Icon"]),
      icon: pick(ICON_KEYS),
      shape: pick(SHAPE_KEYS),
      ring: pick(RING_KEYS),
    },
  };
}

type Props = {
  /** Colour index into AVATAR_COLORS; -1 = anonymous "?" */
  preset: number;
  style: AvatarStyle;
  nick: string;
  onChange: (preset: number, style: AvatarStyle) => void;
};

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.label}>{label}</Text>
      {children}
    </View>
  );
}

// "Customise avatar" panel: initials or icon, colour, shape and ring
export default function AvatarPicker({ preset, style, nick, onChange }: Props) {
  const anonymous = preset < 0;
  const show: Show = anonymous ? "Anonymous" : style.mode;
  const [bg, fg] = AVATAR_COLORS[Math.max(0, preset) % AVATAR_COLORS.length];
  const initial = (nick.replace(/[^A-Za-z]/g, "").charAt(0) || "U").toUpperCase();
  const setStyle = (change: Partial<AvatarStyle>) => onChange(preset, { ...style, ...change });

  return (
    <View style={styles.panel}>
      <Section label="Show">
        <Segmented<Show>
          value={show}
          onChange={(v) => (v === "Anonymous" ? onChange(-1, style) : onChange(Math.max(0, preset), { ...style, mode: v }))}
          options={[
            { value: "Initials", label: "Initials" },
            { value: "Icon", label: "Icon" },
            { value: "Anonymous", label: "Anonymous" },
          ]}
        />
      </Section>

      {show === "Initials" && (
        <Section label="Initials (1–2 letters)">
          <TextInput
            value={style.text}
            onChangeText={(t) => setStyle({ text: t.replace(/[^A-Za-z]/g, "").slice(0, 2).toUpperCase() })}
            placeholder={initial}
            placeholderTextColor={colors.faint}
            autoCapitalize="characters"
            autoCorrect={false}
            maxLength={2}
            style={styles.initials}
          />
        </Section>
      )}

      {show === "Icon" && (
        <Section label="Icon">
          <View style={styles.iconGrid}>
            {ICON_KEYS.map((key) => {
              const selected = style.icon === key;
              return (
                <View key={key} style={styles.iconCell}>
                  <Pressable
                    onPress={() => setStyle({ icon: key })}
                    accessibilityRole="button"
                    accessibilityLabel={`${key.toLowerCase()} icon`}
                    accessibilityState={{ selected }}
                    style={[
                      styles.iconTile,
                      { backgroundColor: selected ? bg : colors.surface, borderColor: selected ? colors.brand : colors.ink },
                    ]}
                  >
                    <Icon name={AVATAR_ICONS[key]} size={26} color={selected ? fg : colors.body} strokeWidth={2} />
                  </Pressable>
                </View>
              );
            })}
          </View>
        </Section>
      )}

      {!anonymous && (
        <>
          <Section label="Colour">
            <View style={styles.colours}>
              {AVATAR_COLORS.map(([colour], i) => (
                <Pressable
                  key={colour}
                  onPress={() => onChange(i, style)}
                  accessibilityRole="button"
                  accessibilityLabel={`Colour ${i + 1}`}
                  accessibilityState={{ selected: preset === i }}
                  style={[
                    styles.colour,
                    { backgroundColor: colour, boxShadow: preset === i ? SELECTED_RING : "inset 0 0 0 1px rgba(20,20,43,0.08)" },
                  ]}
                />
              ))}
            </View>
          </Section>

          <Section label="Shape">
            <Segmented<AvatarShape>
              value={style.shape}
              onChange={(shape) => setStyle({ shape })}
              options={[
                { value: "Circle", label: "Circle" },
                { value: "Soft", label: "Soft" },
                { value: "Square", label: "Square" },
              ]}
            />
          </Section>

          <Section label="Ring">
            <View style={styles.rings}>
              {RING_KEYS.map((key) => {
                const selected = style.ring === key;
                return (
                  <Pressable
                    key={key}
                    onPress={() => setStyle({ ring: key })}
                    accessibilityRole="button"
                    accessibilityLabel={key === "None" ? "No ring" : `${key.toLowerCase()} ring`}
                    accessibilityState={{ selected }}
                    style={[
                      styles.ring,
                      { borderColor: AVATAR_RINGS[key] ?? colors.ink },
                      selected && { boxShadow: `0 0 0 2px ${colors.canvas}, 0 0 0 4px ${colors.brand}` },
                    ]}
                  >
                    {key === "None" && <Text style={styles.ringOff}>off</Text>}
                  </Pressable>
                );
              })}
            </View>
          </Section>
        </>
      )}

      <Pressable
        onPress={() => {
          const next = surpriseAvatar(style);
          onChange(next.preset, next.style);
        }}
        accessibilityRole="button"
        style={styles.surprise}
      >
        <Icon name="shuffle" size={16} color={colors.brand} strokeWidth={2.4} />
        <Text style={styles.surpriseText}>Surprise me</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: { backgroundColor: colors.canvas, borderRadius: 20, padding: 16, gap: 16 },
  section: { gap: 8 },
  label: { color: colors.muted, textTransform: "uppercase", ...font(700, 12, undefined, 0.04) },
  initials: {
    height: 46,
    borderWidth: 2,
    borderColor: colors.ink,
    borderRadius: 12,
    paddingHorizontal: 14,
    backgroundColor: colors.surface,
    color: colors.ink,
    ...font(800, 17, undefined, 0.08),
  },
  iconGrid: { flexDirection: "row", flexWrap: "wrap", marginHorizontal: -4, rowGap: 8 },
  iconCell: { width: "20%", paddingHorizontal: 4 },
  iconTile: { aspectRatio: 1, borderRadius: 14, borderWidth: 2.5, alignItems: "center", justifyContent: "center" },
  colours: { flexDirection: "row", gap: 8 },
  colour: { flex: 1, aspectRatio: 1, borderRadius: 999 },
  rings: { flexDirection: "row", gap: 8 },
  ring: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 4,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  ringOff: { color: colors.faint, ...font(800, 10) },
  surprise: {
    height: 42,
    borderRadius: 12,
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: colors.brandLight,
    backgroundColor: colors.surface,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  surpriseText: { color: colors.brand, ...font(700, 13.5) },
});
