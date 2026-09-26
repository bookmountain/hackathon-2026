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
