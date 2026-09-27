// Address → map pin with OpenStreetMap's Nominatim, limited to around the Adelaide CBD
import type { MapPoint } from "@/data/types";

export const GEOCODE_DELAY_MS = 650;
const MIN_LENGTH = 4;

export type GeocodeResult = MapPoint & {
  /** First four parts of the full address, e.g. "25, Frome Street, Adelaide, Adelaide City Council" */
  name: string;
  /** "25 Frome Street", when OSM knows the road */
  street: string | null;
  suburb: string | null;
};

/** The text to look up, or null when it's too short. Adds ", Adelaide SA" unless a place is already named. */
export function geocodeQuery(text: string): string | null {
  const t = text.trim();
  if (t.length < MIN_LENGTH) return null;
  return /adelaide|\bSA\b|south australia|\b5\d{3}\b/i.test(t) ? t : `${t}, Adelaide SA`;
}

export function geocodeUrl(query: string): string {
  return (
    "https://nominatim.openstreetmap.org/search?format=jsonv2&limit=4&addressdetails=1&countrycodes=au" +
    `&viewbox=138.50,-34.85,138.72,-35.00&q=${encodeURIComponent(query)}`
  );
}

/** First four comma-separated parts of a Nominatim display_name */
export function shortName(displayName: string): string {
  return displayName
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean)
    .slice(0, 4)
    .join(", ");
}

type NominatimPlace = {
  lat: string;
  lon: string;
  display_name: string;
  address?: Record<string, string | undefined>;
};

export function toResult(place: NominatimPlace): GeocodeResult {
  const a = place.address ?? {};
  const road = a.road ?? a.pedestrian ?? a.footway ?? null;
  return {
    latitude: Number(place.lat),
    longitude: Number(place.lon),
    name: shortName(place.display_name),
    street: road ? [a.house_number, road].filter(Boolean).join(" ") : null,
    suburb: a.suburb ?? a.city_district ?? a.town ?? a.city ?? null,
  };
}

export async function geocode(text: string, signal?: AbortSignal): Promise<GeocodeResult[]> {
  const query = geocodeQuery(text);
  if (!query) return [];
  const res = await fetch(geocodeUrl(query), { headers: { "Accept-Language": "en" }, signal });
  if (!res.ok) throw new Error(`Geocoding failed (${res.status})`);
  const places = (await res.json()) as NominatimPlace[];
  return places.map(toResult).filter((r) => Number.isFinite(r.latitude) && Number.isFinite(r.longitude));
}
