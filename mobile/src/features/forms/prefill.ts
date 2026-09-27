// Edit mode for Sell, List a room and Host: turn a detail response back into the
// form's draft, and work out which photos still need uploading on save.
import type { LocalPhoto } from "@/api/photos";
import type { EventDetailDto, FlatDetailDto, ItemDetailDto } from "@/api/types";
import type { RoomDraft } from "@/features/flats/logic";
import type { ItemDraft } from "@/features/market/logic";
import type { EventDraft } from "@/features/meetups/logic";
import { formatAuDate } from "@/lib/auDate";
import { parseDateOnly } from "@/lib/dates";
import { EVERYONE } from "./studyLevels";

/** Name the API gives a dropped pin nobody named (MeetupCatalog.PinnedLocation) */
const PINNED_LOCATION = "Pinned location";

/**
 * Photos already on a listing, shown like picked ones. `keys` maps each photo's URL to
 * its storage key, which is sent back on save instead of uploading it again.
 */
export type ExistingPhotos = { photos: LocalPhoto[]; keys: Record<string, string> };

export function existingPhotos(urls: string[], keys: string[]): ExistingPhotos {
  const map: Record<string, string> = {};
  // Only the owner gets keys; without them the photos can't be kept
  const photos = urls.flatMap((uri, i) => {
    if (!keys[i]) return [];
    map[uri] = keys[i];
    return [{ uri, contentType: "image/jpeg" }];
  });
  return { photos, keys: map };
}

/**
 * Photo keys for the save request, in the form's order: existing photos keep their key,
 * new ones go through `upload` (one at a time, so the cover stays first)
 */
export async function photoKeysFor(
  photos: LocalPhoto[],
  keys: Record<string, string>,
  upload: (photo: LocalPhoto) => Promise<string>,
): Promise<string[]> {
  const result: string[] = [];
  for (const photo of photos) result.push(keys[photo.uri] ?? (await upload(photo)));
  return result;
}

const pad = (n: number) => String(n).padStart(2, "0");

/** The Host form filled in from an event you host; `levels` are the ones kept on this phone */
export function eventForm(
  d: EventDetailDto,
  levels?: string[],
): { draft: EventDraft; dateText: string; time: string; levels: string[] } {
  const e = d.summary;
  const start = new Date(e.startsAt);
  const custom = !e.place.placeId;
  return {
    draft: {
      title: e.title,
      cat: e.type,
      when: start,
      where: e.place.placeId ?? "custom",
      pin: custom ? { latitude: e.place.lat, longitude: e.place.lng } : null,
      place: custom && e.place.name !== PINNED_LOCATION ? e.place.name : "",
      desc: d.description ?? "",
      cap: e.capacity,
      walkIn: e.walkInsWelcome,
      kept: { startsAt: e.startsAt, endsAt: e.endsAt ?? null, placeId: e.place.placeId ?? null, placeName: custom ? null : e.place.name },
    },
    // The form types the phone's local date and time
    dateText: formatAuDate(start),
    time: `${pad(start.getHours())}:${pad(start.getMinutes())}`,
    levels: levels?.length ? levels : [EVERYONE],
  };
}

/** The Sell form filled in from your item; a Sold item stays Sold unless you pick another availability */
export function itemForm(d: ItemDetailDto): ExistingPhotos & { draft: ItemDraft; fromText: string; sold: boolean } {
  const i = d.summary;
  const { photos, keys } = existingPhotos(d.photoUrls, d.photoKeys);
  const from = i.availability === "From" && i.availableFrom ? parseDateOnly(i.availableFrom) : null;
  const custom = !i.pickup.pickupPointId;
  return {
    photos,
    keys,
    draft: {
      photos,
      title: i.title,
      price: String(i.price),
      desc: d.description ?? "",
      category: i.category,
      condition: i.condition,
      avail: i.availability === "Sold" ? "Now" : i.availability,
      from,
      pickup: i.pickup.pickupPointId ?? "custom",
      pin: custom ? { latitude: i.pickup.lat, longitude: i.pickup.lng } : null,
      placeName: custom ? (i.pickup.name ?? "") : "",
      conditionNote: i.conditionNote ?? null,
    },
    fromText: from ? formatAuDate(from) : "",
    sold: i.availability === "Sold",
  };
}

/** The List a room form filled in from your room; `housemates` are sent back unchanged */
export function roomForm(
  d: FlatDetailDto,
): ExistingPhotos & { draft: RoomDraft; fromText: string; stayText: string; housemates: string[] } {
  const f = d.summary;
  const { photos, keys } = existingPhotos(d.photoUrls, d.photoKeys);
  const from = f.availableFrom ? parseDateOnly(f.availableFrom) : null;
  return {
    photos,
    keys,
    draft: {
      photos,
      title: f.title,
      street: f.street ?? "",
      suburb: f.suburb,
      pin: { latitude: f.lat, longitude: f.lng },
      price: String(f.rentPerWeek),
      bills: f.billsPerWeek ? String(f.billsPerWeek) : "",
      beds: f.bedrooms,
      members: f.flatmates,
      toilet: f.toilet,
      bath: f.bathroom,
      minStay: d.minStayMonths,
      furnished: f.furnished,
      feats: d.features,
      rhythm: d.houseRhythm,
      pref: d.preferredFlatmate ?? "",
      desc: d.description ?? "",
      from,
    },
    fromText: from ? formatAuDate(from) : "",
    stayText: d.minStayMonths ? String(d.minStayMonths) : "",
    housemates: d.housemates,
  };
}
