// Colour tokens
export const colors = {
  brand: "#2E5AA8",
  brandPressed: "#274C8C",
  brandDeep: "#274C8C", // text on soft-blue pills
  brandSoft: "#EFF0FF",
  brandSofter: "#E3E5FF",
  brandSelected: "#EFF0FF",
  blueTint: "#EFF3FF", // recommendation cards, "Going" pills
  brandLight: "#A9BEDE", // dashed borders, light text on ink
  brandMid: "#A9BEDE",

  ink: "#14142B",
  body: "#3B3B5C",
  muted: "#55557A",
  faint: "#8A8AA8",

  surface: "#FFFFFF",
  canvas: "#FAFAF6",
  segment: "#F0F3FA", // segmented-control tracks, slider rails
  line: "#14142B", // input and card borders (2px)
  lineSoft: "#14142B", // header / footer dividers (2px)
  lineNeutral: "#E4E4EE", // unselected option cards, list backgrounds
  tabLine: "#E7E9F2",
  lineLight: "#E1E4F0", // light 1.5px rules: activity rows, reminder pills, compact calendar buttons
  checkbox: "#B4B4C8",

  yellow: "#F4B740",
  yellowPressed: "#FFC960",
  yellowSoft: "#FFF1C2",
  yellowInk: "#7A5A00",
  amberSoft: "#FFF6E6", // reminder banners, "Hosting" and recommendation reason pills
  amberInk: "#8A6A1E",
  coral: "#FF6B4A",

  success: "#1E7B45",
  error: "#B3261E",
  appleRed: "#E5484D",
  aiBorder: "#CFDDFF",
  aiBg: "#F5F8FF",

  disabled: "#B4B4C8",
  danger: "#D7263D",
  anon: "#E4E4EE", // "?" avatars for hidden people
  soldSoft: "#EEF0F4",

  // Map markers (the design's map script uses its own brighter palette)
  pinBlue: "#2A44E8", // room price pills, dropped pins, the "you" dot
  pinCoral: "#FF5A2D", // event headcount tags, selected rooms, pickup counts
  pinInk: "#0F1226", // pickup discs, selected tags

  lightbox: "#0B0E1C",
  lightboxThumb: "#1C2148",
  scrim: "rgba(20,20,43,0.3)",
} as const;

export type ColorName = keyof typeof colors;
