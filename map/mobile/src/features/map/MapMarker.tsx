import { createContext, useContext, useState, type ReactNode } from "react";
import { StyleSheet, View, type LayoutChangeEvent } from "react-native";
import type { MapPoint } from "@/data/types";

/** Screen pixels per map unit, provided by <CampusMap> */
export const ScaleContext = createContext(1);

type MarkerProps = MapPoint & { children: ReactNode; zIndex?: number };

/**
 * Centres its child on a map point (CSS translate(-50%, -50%)). The child is
 * measured first, so it stays inside its own bounds and remains tappable on Android.
 */
export default function MapMarker({ x, y, children, zIndex = 3 }: MarkerProps) {
  const scale = useContext(ScaleContext);
  const [size, setSize] = useState<{ width: number; height: number } | null>(null);
  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    if (!size || size.width !== width || size.height !== height) setSize({ width, height });
  };
  return (
    <View
      onLayout={onLayout}
      style={[
        styles.marker,
        {
          left: x * scale - (size?.width ?? 0) / 2,
          top: y * scale - (size?.height ?? 0) / 2,
          zIndex,
          opacity: size ? 1 : 0,
        },
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  marker: { position: "absolute" },
});
