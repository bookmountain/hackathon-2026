import type { Region } from "react-native-maps";
import type { MapPoint } from "@/data/types";

/** Opening view: the CBD campuses down to Gouger St (North Adelaide is a short pan up) */
export const CBD_REGION: Region = {
  latitude: -34.9222,
  longitude: 138.6025,
  latitudeDelta: 0.02,
  longitudeDelta: 0.018,
};

/**
 * Opening view of the full-screen tab maps: the design's centre (-34.9310, 138.5950)
 * as it renders there: North Adelaide at the top down to Unley, the CBD in the middle
 */
export const MAIN_REGION: Region = {
  latitude: -34.931,
  longitude: 138.595,
  latitudeDelta: 0.05,
  longitudeDelta: 0.038,
};

/** Where "You" sits for the demo (Rundle Mall). Swap for device location later. */
export const YOU: MapPoint = { latitude: -34.92284, longitude: 138.6026 };

/** Campus reference points for walk-time estimates */
export const CAMPUS = {
  adelaide: { latitude: -34.9199, longitude: 138.6043 },
  flindersCity: { latitude: -34.92053, longitude: 138.59804 },
} satisfies Record<string, MapPoint>;

/** A close-up around a point, for detail screens ("Pickup location", event map) */
export function regionAround(point: MapPoint, delta = 0.004): Region {
  return { ...point, latitudeDelta: delta, longitudeDelta: delta };
}

const EARTH_RADIUS_M = 6_371_000;

/** Straight-line distance in metres (haversine) */
export function distanceMeters(a: MapPoint, b: MapPoint): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.latitude)) * Math.cos(toRad(b.latitude)) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(h));
}

/** ~80 m per minute on the CBD grid; never shows less than 2 minutes */
const WALK_METERS_PER_MINUTE = 80;

export function walkMinutes(from: MapPoint, to: MapPoint): number {
  return Math.max(2, Math.round(distanceMeters(from, to) / WALK_METERS_PER_MINUTE));
}

/** Nudge a point by metres (north, east), e.g. so an event sits beside its pickup marker */
export function offsetMeters(point: MapPoint, north: number, east: number): MapPoint {
  const dLat = north / 111_320;
  const dLon = east / (111_320 * Math.cos((point.latitude * Math.PI) / 180));
  return { latitude: point.latitude + dLat, longitude: point.longitude + dLon };
}
