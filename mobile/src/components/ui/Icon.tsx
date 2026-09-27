import type { ReactNode } from "react";
import Svg, { Circle, Path, Rect } from "react-native-svg";

type IconDef = {
  body: ReactNode;
  strokeWidth?: number;
  /** Solid icons are filled with the colour instead of stroked */
  solid?: boolean;
};

// 24×24 line icons from the design. strokeWidth is the design's default per icon.
const ICONS = {
  back: { body: <Path d="M15 18l-6-6 6-6" />, strokeWidth: 2.2 },
  arrowRight: { body: <Path d="M5 12h14M13 6l6 6-6 6" />, strokeWidth: 2.4 },
  chevronDown: { body: <Path d="M6 9l6 6 6-6" />, strokeWidth: 2.4 },
  check: { body: <Path d="M5 12l5 5 9-10" />, strokeWidth: 3.2 },
  plus: { body: <Path d="M12 5v14M5 12h14" />, strokeWidth: 3 },
  shield: { body: <Path d="M12 3l8 3v6c0 4.5-3.4 8-8 9-4.6-1-8-4.5-8-9V6z" />, strokeWidth: 2.4 },
  chat: { body: <Path d="M4 5h16v11H9l-5 4z" />, strokeWidth: 2.2 },
  map: {
    body: (
      <>
        <Path d="M9 4L3 6v14l6-2 6 2 6-2V4l-6 2z" />
        <Path d="M9 4v14M15 6v14" />
      </>
    ),
    strokeWidth: 2.4,
  },
  list: { body: <Path d="M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01" />, strokeWidth: 2.6 },
  star: {
    body: <Path d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6-4.9-4.6 6.6-.8z" />,
    solid: true,
  },
  tag: { body: <Path d="M3 12V4h8l10 10-8 8z" />, strokeWidth: 2.8 },
  tagTab: {
    body: (
      <>
        <Path d="M3 12V4h8l10 10-8 8z" />
        <Circle cx="7.5" cy="7.5" r="1.5" />
      </>
    ),
    strokeWidth: 2.1,
  },
  house: { body: <Path d="M3 11l9-7 9 7v9H3z" />, strokeWidth: 2.8 },
  houseTab: { body: <Path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" />, strokeWidth: 2.1 },
  people: {
    body: (
      <>
        <Circle cx="9" cy="8" r="3.5" />
        <Path d="M2.5 20a6.5 6.5 0 0 1 13 0M16 4.5a3.5 3.5 0 0 1 0 7M18 14.5a6.5 6.5 0 0 1 3.5 5.5" />
      </>
    ),
    strokeWidth: 2.6,
  },
  search: {
    body: (
      <>
        <Circle cx="11" cy="11" r="6.5" />
        <Path d="M20 20l-4-4" />
      </>
    ),
    strokeWidth: 2.4,
  },
  pin: { body: <Path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z" />, strokeWidth: 2.6 },
  camera: {
    body: (
      <>
        <Rect x="3" y="6" width="18" height="14" rx="3" />
        <Circle cx="12" cy="13" r="3.5" />
        <Path d="M8 6l1.5-2h5L16 6" />
      </>
    ),
    strokeWidth: 2,
  },
  lock: {
    body: (
      <>
        <Rect x="5" y="11" width="14" height="10" rx="2" />
        <Path d="M8 11V8a4 4 0 0 1 8 0v3" />
      </>
    ),
    strokeWidth: 2.2,
  },
  close: { body: <Path d="M6 6l12 12M18 6L6 18" />, strokeWidth: 2.4 },
  /** Sliders: the Filters button */
  filter: {
    body: (
      <>
        <Path d="M4 7h9M17 7h3M4 17h3M11 17h9" />
        <Circle cx="15" cy="7" r="2.2" />
        <Circle cx="9" cy="17" r="2.2" />
      </>
    ),
    strokeWidth: 2.2,
  },
  mail: {
    body: (
      <>
        <Rect x="3" y="5" width="18" height="14" rx="3" />
        <Path d="M3.5 7l8.5 6 8.5-6" />
      </>
    ),
    strokeWidth: 2.2,
  },
  gradCap: {
    body: (
      <>
        <Path d="M12 3l9 4.5-9 4.5-9-4.5z" />
        <Path d="M7 10v5c0 1.7 2.2 3 5 3s5-1.3 5-3v-5" />
      </>
    ),
    strokeWidth: 2.2,
  },
  /** Corner brackets + lens: "Search by image" */
  imageSearch: {
    body: (
      <>
        <Path d="M4 8V6a2 2 0 0 1 2-2h2M16 4h2a2 2 0 0 1 2 2v2M20 16v2a2 2 0 0 1-2 2h-2M8 20H6a2 2 0 0 1-2-2v-2" />
        <Circle cx="12" cy="12" r="3.5" />
      </>
    ),
    strokeWidth: 2.2,
  },
  /** Recenter the map */
  crosshair: {
    body: (
      <>
        <Circle cx="12" cy="12" r="4" />
        <Path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
        <Circle cx="12" cy="12" r="1.2" fill="currentColor" />
      </>
    ),
    strokeWidth: 2.4,
  },
  calendar: {
    body: (
      <>
        <Rect x="3.5" y="5" width="17" height="15" rx="3" />
        <Path d="M3.5 10h17M8 3v4M16 3v4" />
      </>
    ),
    strokeWidth: 2.2,
  },
  calendarCheck: {
    body: (
      <>
        <Rect x="3.5" y="5" width="17" height="15" rx="3" />
        <Path d="M3.5 10h17M8 3v4M16 3v4M9 14.5l2 2 4-4" />
      </>
    ),
    strokeWidth: 2.2,
  },
  pinDot: {
    body: (
      <>
        <Path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z" />
        <Circle cx="12" cy="9.5" r="2.5" />
      </>
    ),
    strokeWidth: 2.2,
  },
  sparkle: {
    body: <Path d="M12 2l1.8 5.2L19 9l-5.2 1.8L12 16l-1.8-5.2L5 9l5.2-1.8zM19 14l.9 2.1L22 17l-2.1.9L19 20l-.9-2.1L16 17l2.1-.9z" />,
    solid: true,
  },
  shuffle: { body: <Path d="M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6M4 4l5 5" />, strokeWidth: 2.2 },
  /** "More" tab */
  more: {
    body: (
      <>
        <Circle cx="12" cy="12" r="3.2" />
        <Path d="M12 2.8v3M12 18.2v3M4.3 7.5l2.6 1.5M17.1 15l2.6 1.5M4.3 16.5l2.6-1.5M17.1 9l2.6-1.5" />
      </>
    ),
    strokeWidth: 2.1,
  },
  /** Two tilted cards with a sparkle: the centre "Draw card" button */
  cards: {
    body: (
      <>
        <Rect x="4" y="7" width="12.5" height="14" rx="2.6" transform="rotate(-9 10 14)" />
        <Rect x="8" y="4.5" width="12.5" height="14" rx="2.6" transform="rotate(7 14 11)" fill="#fff" />
        <Path d="M14 8.5l1.4 2.8 2.8 1.4-2.8 1.4L14 16.9l-1.4-2.8-2.8-1.4 2.8-1.4z" fill="currentColor" />
      </>
    ),
    strokeWidth: 2,
  },

  // Avatar icons (profile "Show: Icon")
  avCompass: {
    body: (
      <>
        <Circle cx="12" cy="12" r="9" />
        <Path d="M15.5 8.5l-2 5-5 2 2-5z" />
      </>
    ),
  },
  avBook: {
    body: (
      <>
        <Path d="M4 4.5h10a4 4 0 0 1 4 4V20H8a4 4 0 0 1-4-4z" />
        <Path d="M8 9h6M8 13h4" />
      </>
    ),
  },
  avCoffee: {
    body: (
      <>
        <Path d="M4 9h12v5a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5z" />
        <Path d="M16 11h1.5a2.5 2.5 0 0 1 0 5H16M8 3v3M12 3v3" />
      </>
    ),
  },
  avMusic: {
    body: (
      <>
        <Path d="M9 18V5l11-2v13" />
        <Circle cx="6.5" cy="18" r="2.5" />
        <Circle cx="17.5" cy="16" r="2.5" />
      </>
    ),
  },
  avCode: { body: <Path d="M8 7l-5 5 5 5M16 7l5 5-5 5M14 4l-4 16" /> },
  avLeaf: {
    body: (
      <>
        <Path d="M5 19C5 10 10 5 20 4c-1 10-6 15-15 15z" />
        <Path d="M5 19l8-8" />
      </>
    ),
  },
  avCamera: {
    body: (
      <>
        <Rect x="3" y="7" width="18" height="13" rx="3" />
        <Circle cx="12" cy="13.5" r="3.5" />
        <Path d="M8 7l1.5-3h5L16 7" />
      </>
    ),
  },
  avBall: {
    body: (
      <>
        <Circle cx="12" cy="12" r="9" />
        <Path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18" />
      </>
    ),
  },
  avPaw: {
    body: (
      <>
        <Circle cx="7" cy="9" r="1.8" />
        <Circle cx="12" cy="6.5" r="1.8" />
        <Circle cx="17" cy="9" r="1.8" />
        <Path d="M12 12c-3 0-5.5 3.5-5.5 5.5S9 20 12 20s5.5-.5 5.5-2.5S15 12 12 12z" />
      </>
    ),
  },
  bell: {
    body: (
      <>
        <Path d="M18 8a6 6 0 1 0-12 0c0 7-3 8-3 8h18s-3-1-3-8" />
        <Path d="M10.5 20a1.8 1.8 0 0 0 3 0" />
      </>
    ),
    strokeWidth: 2.4,
  },
  clock: {
    body: (
      <>
        <Circle cx="12" cy="12" r="9" />
        <Path d="M12 7v5l3 2" />
      </>
    ),
    strokeWidth: 2.2,
  },
  pencil: {
    body: (
      <>
        <Path d="M4 20h4L19 9l-4-4L4 16z" />
        <Path d="M13.5 6.5l4 4" />
      </>
    ),
    strokeWidth: 2.2,
  },
  trash: { body: <Path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" />, strokeWidth: 2.2 },
  avRocket: {
    body: (
      <>
        <Path d="M12 3c4 2 6 6 6 11l-3 3H9l-3-3c0-5 2-9 6-11z" />
        <Circle cx="12" cy="10" r="2" />
        <Path d="M9 17l-2 4M15 17l2 4" />
      </>
    ),
  },
} satisfies Record<string, IconDef>;

export type IconName = keyof typeof ICONS;

type Props = {
  name: IconName;
  color: string;
  size?: number;
  strokeWidth?: number;
};

export default function Icon({ name, color, size = 20, strokeWidth }: Props) {
  const def: IconDef = ICONS[name];
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      color={color}
      fill={def.solid ? color : "none"}
      stroke={def.solid ? "none" : color}
      strokeWidth={strokeWidth ?? def.strokeWidth ?? 2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {def.body}
    </Svg>
  );
}
