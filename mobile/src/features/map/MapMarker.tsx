import type { ReactNode } from "react";
import { Marker } from "react-native-maps";
import type { MapPoint } from "@/data/types";

type Props = {
  coordinate: MapPoint;
  onPress?: () => void;
  /** Read out by screen readers */
  label?: string;
  zIndex?: number;
  children: ReactNode;
};

// Custom-view pin centred on its coordinate. Taps are handled by the marker
// itself: touchables inside marker views aren't reliable on the native maps.
export default function MapMarker({ coordinate, onPress, label, zIndex = 3, children }: Props) {
  return (
    <Marker
      // Only lat/lng go to the native side; callers may pass whole listings
      coordinate={{ latitude: coordinate.latitude, longitude: coordinate.longitude }}
      anchor={{ x: 0.5, y: 0.5 }}
      zIndex={zIndex}
      accessibilityLabel={label}
      onPress={
        onPress &&
        ((e) => {
          e.stopPropagation();
          onPress();
        })
      }
    >
      {children}
    </Marker>
  );
}
