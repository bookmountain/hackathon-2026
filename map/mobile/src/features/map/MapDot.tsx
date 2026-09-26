import { Circle, G } from "react-native-svg";
import type { MapPoint } from "@/data/types";
import { colors } from "@/theme";

type Props = MapPoint & {
  color?: string;
  /** Soft ring around the dot; 0 hides it */
  halo?: number;
  haloOpacity?: number;
  radius?: number;
  stroke?: string;
  strokeWidth?: number;
};

// SVG dot for MiniMap: a dropped pin, a pickup point or an event location
export default function MapDot({
  x,
  y,
  color = colors.brand,
  halo = 16,
  haloOpacity = 0.2,
  radius = 7,
  stroke = colors.surface,
  strokeWidth = 3,
}: Props) {
  return (
    <G>
      {halo > 0 && <Circle cx={x} cy={y} r={halo} fill={color} fillOpacity={haloOpacity} />}
      <Circle cx={x} cy={y} r={radius} fill={color} stroke={stroke} strokeWidth={strokeWidth} />
    </G>
  );
}
