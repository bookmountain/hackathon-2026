import type { MapPoint } from "@/data/types";

// The design draws the CBD in a 390 × 660 coordinate space; every pin uses it.
export const MAP_WIDTH = 390;
export const MAP_HEIGHT = 660;
/** The full-screen map starts scrolled this far down, like the design (top: -26px) */
export const MAP_INITIAL_SCROLL = 26;

/** Where "You" sits on the demo map */
export const YOU: MapPoint = { x: 180, y: 330 };

export type ViewBox = { x: number; y: number; width: number; height: number };

export function viewBoxString(v: ViewBox): string {
  return `${v.x} ${v.y} ${v.width} ${v.height}`;
}

/** 2:1 close-up around a point, used by detail screens ("Pickup location", event map) */
export function focusViewBox(point: MapPoint): ViewBox {
  return { x: point.x - 120, y: point.y - 60, width: 240, height: 120 };
}

/** Crops used by the pin-drop pickers in the forms */
export const PICKER_VIEWBOX = {
  /** Room and event location pickers */
  square: { x: 0, y: 40, width: MAP_WIDTH, height: 390 },
  /** Marketplace custom pickup picker */
  wide: { x: 0, y: 130, width: MAP_WIDTH, height: 230 },
} satisfies Record<string, ViewBox>;

/**
 * Convert a tap on a rendered map (in view pixels) to map coordinates.
 * Assumes the map fills the view without letterboxing (aspect ratio matches the view box).
 */
export function touchToMap(
  touch: { x: number; y: number },
  size: { width: number; height: number },
  viewBox: ViewBox,
): MapPoint {
  return {
    x: Math.round(viewBox.x + (touch.x / size.width) * viewBox.width),
    y: Math.round(viewBox.y + (touch.y / size.height) * viewBox.height),
  };
}

/** Rough walking minutes between two map points (design's estimate, never under 2) */
export function walkMinutes(from: MapPoint, to: MapPoint): number {
  return Math.max(2, Math.round(Math.hypot(from.x - to.x, from.y - to.y) / 11));
}

/** Campus reference points for walk-time estimates */
export const CAMPUS = {
  adelaide: { x: 264, y: 195 },
  flindersCity: { x: 145, y: 205 },
} satisfies Record<string, MapPoint>;
