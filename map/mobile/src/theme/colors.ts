// Colour tokens from design/UCompass Demo.dc.html
export const colors = {
  brand: "#1F5BFF",
  brandPressed: "#1646CC",
  brandDeep: "#1646CC", // text on soft-blue pills
  brandSoft: "#EEF3FF",
  brandSofter: "#E3ECFF",
  brandSelected: "#F3F6FF",
  brandLight: "#BFD4FF",
  brandMid: "#7FB2FF",

  ink: "#0A1A3F",
  body: "#33446A",
  muted: "#5B6B8C",
  faint: "#8594B3",

  surface: "#FFFFFF",
  canvas: "#F6F8FE",
  segment: "#F0F3FA",
  line: "#DCE5FA",
  lineSoft: "#EEF1F8",
  checkbox: "#BFCBE6",

  yellow: "#FFC940",
  yellowSoft: "#FFF1C2",
  yellowInk: "#7A5A00",

  disabled: "#A9B7D6",
  danger: "#C0392B",
  anon: "#E7ECF6", // "?" avatars for hidden people
  soldSoft: "#EEF0F4",
} as const;

export type ColorName = keyof typeof colors;
