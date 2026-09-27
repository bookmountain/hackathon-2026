// Turn API responses into the shapes the screens use (data/types.ts).
import type {
  ChatMessageDto,
  ChatSummaryDto,
  EventDetailDto,
  EventSummaryDto,
  FlatDetailDto,
  FlatSummaryDto,
  ItemCategoryValue,
  ItemDetailDto,
  ItemSummaryDto,
  PersonDto,
  PickupPointDto,
  University,
} from "@/api/types";
import { dayMonth, parseDateOnly, timeAgo } from "@/lib/dates";
import type {
  ChatMessage,
  ChatThread,
  EventDetail,
  Flat,
  FlatDetail,
  Item,
  ItemCategory,
  ItemDetail,
  MeetupEvent,
  Person,
  Pickup,
  Uni,
} from "./types";

/** Placeholder colour behind a listing without photos */
const TONE = "#DCE6FF";

export const UNI_LABEL: Record<University, Uni> = { Adelaide: "Adelaide Uni", Flinders: "Flinders Uni" };

/**
 * The API returns the full degree name; show the subject like the design does:
 * "Bachelor of Mathematics (Honours)" → "Mathematics (Honours)".
 */
export function majorLabel(degree: string | null | undefined): string {
  if (!degree) return "";
  return degree
    .replace(/\b(Bachelor|Master|Doctor|Associate Degree|Advanced Diploma|Graduate Diploma|Graduate Certificate|Diploma|Certificate)s? (of|in) /g, "")
    .trim();
}

export function toPerson(p: PersonDto): Person {
  return {
    id: p.userId,
    nick: p.displayName,
    major: majorLabel(p.major),
    uni: UNI_LABEL[p.university],
    avatar: p.avatarPreset ?? -1,
    avatarUrl: p.avatarUrl,
    avatarStyle: p.avatarStyle,
  };
}

/** "Available now", or "From 14 Oct" while the date is still ahead */
function fromLabel(availableFrom: string | null, now: Date): string {
  if (!availableFrom) return "Available now";
  const date = parseDateOnly(availableFrom);
  return date > now ? `From ${dayMonth(date)}` : "Available now";
}

const TOILET = { PrivateEnsuite: "Private ensuite", Shared: "Shared toilet" } as const;
const BATH = { Ensuite: "Ensuite shower", Shared: "Shared bathroom" } as const;
const FURNISHED = { Fully: "Fully furnished", Partly: "Partly furnished", Unfurnished: "Unfurnished" } as const;

export function toFlat(f: FlatSummaryDto, now = new Date()): Flat {
  return {
    id: f.id,
    title: f.title,
    area: f.street ? `${f.suburb} · ${f.street}` : f.suburb,
    price: f.rentPerWeek,
    bills: f.billsPerWeek,
    beds: f.bedrooms,
    toilet: TOILET[f.toilet],
    bath: BATH[f.bathroom],
    members: f.flatmates,
    furnished: FURNISHED[f.furnished],
    walkA: f.walkToAdelaideUni,
    walkF: f.walkToFlindersCity,
    from: fromLabel(f.availableFrom, now),
    photo: f.coverPhotoUrl,
    mine: f.isMine,
    taken: f.status === "Taken",
    latitude: f.lat,
    longitude: f.lng,
    tone: TONE,
  };
}

export function minStayLabel(months: number | null): string {
  if (!months) return "Flexible";
  return months === 1 ? "1 month" : `${months} months`;
}

export function toFlatDetail(d: FlatDetailDto, now = new Date()): FlatDetail {
  return {
    ...toFlat(d.summary, now),
    desc: d.description ?? "",
    minStay: minStayLabel(d.minStayMonths),
    pref: d.preferredFlatmate || "Any verified student",
    feats: d.features,
    tenants: d.housemates,
    rhythm: d.houseRhythm,
    photos: d.photoUrls,
    owner: toPerson(d.owner),
  };
}

export const CATEGORY_LABEL: Record<ItemCategoryValue, ItemCategory> = {
  Textbooks: "Textbooks",
  Tech: "Tech",
  Furniture: "Furniture",
  Kitchen: "Kitchen",
  StudyGear: "Study gear",
};

export function toPickup(p: PickupPointDto): Pickup {
  return { id: p.id, name: p.name, short: p.shortName, sub: p.note, latitude: p.lat, longitude: p.lng };
}

/** Text shown when a seller didn't name their own pin */
export const OWN_PIN_NAME = "Seller's pinned spot";

function availabilityLabel(i: ItemSummaryDto): string {
  switch (i.availability) {
    case "Now":
      return "Available now";
    case "From":
      return i.availableFrom ? `Available from ${dayMonth(parseDateOnly(i.availableFrom))}` : "Available soon";
    case "Pending":
      return "Pending";
    case "Sold":
      return "Sold";
  }
}

/** `pickups` supplies the short names ("Barr Smith") of the safe pickup points */
export function toItem(i: ItemSummaryDto, pickups: Pickup[], now = new Date()): Item {
  const pickup = pickups.find((p) => p.id === i.pickup.pickupPointId);
  const name = i.pickup.name ?? pickup?.name ?? OWN_PIN_NAME;
  return {
    id: i.id,
    title: i.title,
    price: i.price,
    avail: availabilityLabel(i),
    cond: i.conditionLabel,
    cat: CATEGORY_LABEL[i.category],
    loc: {
      pickupId: i.pickup.pickupPointId,
      name,
      short: pickup?.short ?? name,
      sub: i.pickup.pickupPointId ? (i.pickup.note ?? pickup?.sub ?? "") : "",
      latitude: i.pickup.lat,
      longitude: i.pickup.lng,
    },
    posted: timeAgo(i.createdAt, now),
    photo: i.coverPhotoUrl,
    mine: i.isMine,
    tone: TONE,
  };
}

export function toItemDetail(d: ItemDetailDto, pickups: Pickup[], now = new Date()): ItemDetail {
  return {
    ...toItem(d.summary, pickups, now),
    desc: d.description || "No description yet.",
    photos: d.photoUrls,
    seller: toPerson(d.seller),
  };
}

export function toEvent(e: EventSummaryDto): MeetupEvent {
  return {
    id: e.id,
    title: e.title,
    cat: e.type,
    day: e.dayLabel,
    date: e.dateLabel,
    time: e.timeLabel,
    when: e.whenLabel,
    startsAt: e.startsAt,
    endsAt: e.endsAt,
    where: { name: e.place.name, latitude: e.place.lat, longitude: e.place.lng },
    going: e.goingCount,
    cap: e.capacity,
    full: e.isFull,
    walkIns: e.walkInsWelcome,
    joined: e.isGoing,
    host: e.isHost,
  };
}

/**
 * "My activity" meetups: events you host that aren't over (GET /api/events/mine includes
 * past ones) plus upcoming ones you joined (GET /api/events/going, which also lists the
 * ones you host), each once, soonest first
 */
export function toMyEvents(hosted: EventSummaryDto[], going: EventSummaryDto[]): MeetupEvent[] {
  const seen = new Set<string>();
  return [...hosted.filter((e) => !e.isOver), ...going]
    .filter((e) => !seen.has(e.id) && !!seen.add(e.id))
    .sort((a, b) => Date.parse(a.startsAt) - Date.parse(b.startsAt))
    .map(toEvent);
}

export function toEventDetail(d: EventDetailDto): EventDetail {
  return { ...toEvent(d.summary), desc: d.description ?? "" };
}

export function toMessage(m: ChatMessageDto): ChatMessage {
  return {
    id: m.id,
    from: m.kind === "About" ? "system" : m.isMine ? "me" : "them",
    text: m.body,
    about: m.about,
  };
}

/** Last line shown under a name in the Messages list */
export function previewOf(m: ChatMessageDto | null): string {
  if (!m) return "Say hi";
  return m.isMine ? `You: ${m.body}` : m.body;
}

export function toThread(c: ChatSummaryDto): ChatThread {
  return {
    id: c.id,
    person: toPerson(c.other),
    preview: previewOf(c.lastMessage),
    unread: c.unreadCount,
    lastAt: c.lastMessageAt,
  };
}
