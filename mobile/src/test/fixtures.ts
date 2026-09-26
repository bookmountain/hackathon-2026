// API-shaped sample data for unit tests, modelled on the hosted API's seed.
import type {
  ChatMessageDto,
  EventSummaryDto,
  FlatSummaryDto,
  ItemSummaryDto,
  Me,
  PickupPointDto,
} from "@/api/types";
import { toEvent, toFlat, toItem, toPickup } from "@/data/adapters";

export const NOW = new Date(2026, 8, 27, 12, 0); // Sun 27 Sep 2026, noon

export const PICKUP_DTOS: PickupPointDto[] = [
  { id: "adelaide-railway-station", name: "Adelaide Railway Station", shortName: "Railway Stn", note: "North Tce concourse · staffed, CCTV", lat: -34.92142, lng: 138.59758 },
  { id: "flinders-city-campus", name: "Flinders City Campus", shortName: "Flinders City", note: "Festival Plaza entrance", lat: -34.92053, lng: 138.59804 },
  { id: "barr-smith-library", name: "Barr Smith Library", shortName: "Barr Smith", note: "Main entrance, Adelaide Uni", lat: -34.91888, lng: 138.60448 },
];
export const PICKUPS = PICKUP_DTOS.map(toPickup);

export function flatDto(over: Partial<FlatSummaryDto> = {}): FlatSummaryDto {
  return {
    id: "f1",
    title: "Sunny room, 6 min to North Tce",
    suburb: "Adelaide",
    street: "Frome St",
    lat: -34.922,
    lng: 138.607,
    rentPerWeek: 245,
    billsPerWeek: 25,
    totalPerWeek: 270,
    bedrooms: 3,
    flatmates: 2,
    toilet: "PrivateEnsuite",
    bathroom: "Ensuite",
    furnished: "Fully",
    availableFrom: "2026-10-14",
    coverPhotoUrl: "https://r2.example/hackathon-2026/flats/f1/01-bedroom.jpg?sig",
    walkToAdelaideUni: 6,
    walkToFlindersCity: 13,
    nearestCampuses: [],
    status: "Active",
    isMine: false,
    createdAt: "2026-09-26T09:23:59Z",
    ...over,
  };
}

export const FLATS = [
  toFlat(flatDto(), NOW),
  toFlat(flatDto({ id: "f2", rentPerWeek: 280, billsPerWeek: 20, toilet: "Shared", furnished: "Partly", availableFrom: null }), NOW),
  toFlat(flatDto({ id: "f3", rentPerWeek: 185, billsPerWeek: 30, toilet: "Shared", furnished: "Fully" }), NOW),
  toFlat(flatDto({ id: "f4", rentPerWeek: 230, billsPerWeek: 15, toilet: "PrivateEnsuite", furnished: "Fully" }), NOW),
];

export function itemDto(over: Partial<ItemSummaryDto> = {}): ItemSummaryDto {
  return {
    id: "m1",
    title: "Calculus textbook (Stewart, 8th ed.)",
    price: 35,
    category: "Textbooks",
    condition: "Good",
    conditionNote: "some highlighting",
    conditionLabel: "Good — some highlighting",
    availability: "Now",
    availableFrom: null,
    pickup: { pickupPointId: "barr-smith-library", name: "Barr Smith Library", note: "Main entrance, Adelaide Uni", lat: -34.91888, lng: 138.60448 },
    coverPhotoUrl: "https://r2.example/hackathon-2026/items/m1/01.jpg?sig",
    isMine: false,
    // Two hours before NOW, whatever the test machine's time zone
    createdAt: new Date(NOW.getTime() - 2 * 3_600_000).toISOString(),
    ...over,
  };
}

const ownPin = (name: string | null, lat: number, lng: number) => ({ pickupPointId: null, name, note: null, lat, lng });

export const ITEMS = [
  toItem(itemDto(), PICKUPS, NOW),
  toItem(itemDto({ id: "m2", title: "LED desk lamp (USB)", price: 12, category: "Furniture", pickup: { ...itemDto().pickup, pickupPointId: "adelaide-railway-station", name: "Adelaide Railway Station" } }), PICKUPS, NOW),
  toItem(itemDto({ id: "m3", title: "iPad 9th gen + Apple Pencil", price: 320, category: "Tech", availability: "Pending", pickup: { ...itemDto().pickup, pickupPointId: "flinders-city-campus", name: "Flinders City Campus" } }), PICKUPS, NOW),
  toItem(itemDto({ id: "m4", title: "Rice cooker, 5-cup", price: 25, category: "Kitchen", availability: "From", availableFrom: "2026-10-01", pickup: ownPin("Rundle St East", -34.92249, 138.60937) }), PICKUPS, NOW),
  toItem(itemDto({ id: "m5", title: "Mesh office chair", price: 40, category: "Furniture", pickup: ownPin(null, -34.92616, 138.60583) }), PICKUPS, NOW),
  toItem(itemDto({ id: "m6", title: "Lab coat + safety glasses", price: 15, category: "StudyGear", availability: "Sold", pickup: { ...itemDto().pickup, pickupPointId: "flinders-city-campus", name: "Flinders City Campus" } }), PICKUPS, NOW),
];

export function eventDto(over: Partial<EventSummaryDto> = {}): EventSummaryDto {
  return {
    id: "e1",
    title: "Stats cram — walk-ins welcome",
    type: "Study",
    startsAt: "2026-09-29T09:30:00+00:00",
    endsAt: "2026-09-29T12:00:00+00:00",
    dayLabel: "TUE",
    dateLabel: "29",
    timeLabel: "7:00 pm",
    whenLabel: "Tue 29 Sep · 7:00–9:30 pm",
    place: { placeId: "barr-smith-library", name: "Barr Smith Library, Level 2", note: "Main entrance, Adelaide Uni", lat: -34.91888, lng: 138.60448 },
    capacity: 30,
    goingCount: 15,
    isFull: false,
    walkInsWelcome: true,
    isGoing: false,
    isHost: false,
    isHappeningNow: false,
    isOver: false,
    createdAt: "2026-09-26T04:27:57Z",
    ...over,
  };
}

export const EVENT = toEvent(eventDto());

export function messageDto(over: Partial<ChatMessageDto> = {}): ChatMessageDto {
  return {
    id: "msg1",
    conversationId: "c1",
    senderId: "tom",
    isMine: false,
    kind: "Text",
    body: "Still available if you want it.",
    about: null,
    createdAt: "2026-09-26T12:19:58Z",
    ...over,
  };
}

export const ME: Me = {
  userId: "ee9726cb-293a-5f25-935d-1f97a6322528",
  email: "a1900000@adelaide.edu.au",
  university: "Adelaide",
  consentComplete: true,
  profile: {
    userId: "ee9726cb-293a-5f25-935d-1f97a6322528",
    displayName: "Koala_Kai",
    university: "Adelaide",
    degree: { id: 21, name: "Bachelor of Computer Science", level: "Undergraduate", college: "College of Engineering and Information Technology" },
    department: "College of Engineering and Information Technology",
    gender: "Male",
    pronouns: "he/him",
    yearOfStudy: 2,
    bio: "Second-year CS.",
    habits: ["night-owl", "coffee"],
    interests: ["coding"],
    avatarUrl:
      "https://b36c.r2.cloudflarestorage.com/hackathon-2026/avatars/ee9726cb-293a-5f25-935d-1f97a6322528/avatar.png?X-Amz-Expires=86400&X-Amz-Signature=abc",
  },
};
