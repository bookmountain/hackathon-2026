import Svg, { Circle, G, Path } from "react-native-svg";
import { colors } from "@/theme";

type Props = {
  size?: number;
  /** "brand": blue disc (app header). "onBrand": white disc for the blue login screen. */
  variant?: "brand" | "onBrand";
  /** The larger marks have a faint inner ring */
  ring?: boolean;
};

// UCompass compass mark
export default function Logo({ size = 30, variant = "brand", ring = false }: Props) {
  const disc = variant === "brand" ? colors.brand : colors.surface;
  const accent = variant === "brand" ? colors.surface : colors.brand;
  return (
    <Svg width={size} height={size} viewBox="0 0 40 40">
      <Circle cx="20" cy="20" r="20" fill={disc} />
      {ring && (
        <Circle
          cx="20"
          cy="20"
          r="14.5"
          fill="none"
          stroke={accent}
          strokeOpacity={variant === "brand" ? 0.35 : 0.25}
          strokeWidth={1.5}
        />
      )}
      <G transform="rotate(35 20 20)">
        <Path d="M20 7l4.2 13h-8.4z" fill={colors.yellow} />
        <Path d="M20 33l-4.2-13h8.4z" fill={accent} />
      </G>
      <Circle cx="20" cy="20" r="2.2" fill={disc} stroke={accent} strokeWidth={1.2} />
    </Svg>
  );
}
