import type { ReactNode } from "react";
import { Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from "react-native";
import Svg from "react-native-svg";
import CampusMapArt from "./CampusMapArt";
import { MAP_HEIGHT, MAP_INITIAL_SCROLL, MAP_WIDTH } from "./geometry";
import { ScaleContext } from "./MapMarker";
import YouMarker from "./YouMarker";

type Props = {
  /** Pins, rendered in map space (use <MapMarker>) */
  children?: ReactNode;
  /** Tapping empty map, e.g. to close the bottom sheet */
  onBackgroundPress?: () => void;
  /** Floating UI over the map that doesn't scroll with it (chips, hint, sheet) */
  overlay?: ReactNode;
};

// Full-width campus map. The drawing scales to the screen width and scrolls
// vertically when the phone is shorter than the 660-unit map.
export default function CampusMap({ children, onBackgroundPress, overlay }: Props) {
  const { width } = useWindowDimensions();
  const scale = width / MAP_WIDTH;

  return (
    <View style={styles.viewport}>
      <ScrollView
        bounces={false}
        showsVerticalScrollIndicator={false}
        contentOffset={{ x: 0, y: MAP_INITIAL_SCROLL * scale }}
      >
        <View style={{ width, height: MAP_HEIGHT * scale }}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onBackgroundPress} accessible={false}>
            <Svg width={width} height={MAP_HEIGHT * scale} viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}>
              <CampusMapArt />
            </Svg>
          </Pressable>
          <ScaleContext.Provider value={scale}>
            {children}
            <YouMarker />
          </ScaleContext.Provider>
        </View>
      </ScrollView>
      {overlay}
    </View>
  );
}

const styles = StyleSheet.create({
  viewport: { flex: 1, overflow: "hidden", backgroundColor: "#E8EDF8" },
});
