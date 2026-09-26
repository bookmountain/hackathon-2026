// Domain types used by the screens. They're built from API responses by
// data/adapters.ts. Locations are real WGS84 coordinates.

export type Uni = "Adelaide Uni" | "Flinders Uni";

export type Person = {
  id: string;
  nick: string;
  major: string;
  uni: Uni;
  /** Preset colour, an index into AVATAR_COLORS; -1 = none */
  avatar: number;
  /** Uploaded photo avatar; shown instead of the preset when set */
  avatarUrl?: string | null;
};

export type MapPoint = { latitude: number; longitude: number };

/** Staffed, well-lit spots suggested for handovers and meetups */
export type Pickup = MapPoint & {
  id: string;
  name: string;
  short: string;
  sub: string;
};

/** Where an item is picked up: a safe pickup point or the seller's own pin */
export type Place = MapPoint & {
  /** Set for the safe pickup points, null for a seller's own pin */
  pickupId: string | null;
  name: string;
  /** Short label for cards, e.g. "Barr Smith" */
  short: string;
  /** Safe pickup description, empty for custom pins */
  sub: string;
};

export type Flat = MapPoint & {
  id: string;
  title: string;
  area: string;
  price: number;
  bills: number;
  beds: number;
  toilet: string;
  bath: string;
  members: number;
  furnished: string;
  walkA: number;
  walkF: number;
  from: string;
  /** Cover photo URL (expires after 24 h) */
  photo: string | null;
  mine: boolean;
  tone: string;
};

export type FlatDetail = Flat & {
  desc: string;
  minStay: string;
  pref: string;
  feats: string[];
  tenants: string[];
  rhythm: string[];
  photos: string[];
  owner: Person;
};

export type ItemCategory = "Textbooks" | "Tech" | "Furniture" | "Kitchen" | "Study gear";

export type Item = {
  id: string;
  title: string;
  price: number;
  /** "Available now" | "Pending" | "Sold" | "Available from <date>" */
  avail: string;
  cond: string;
  cat: ItemCategory;
  loc: Place;
  posted: string;
  /** Cover photo URL (expires after 24 h) */
  photo: string | null;
  mine: boolean;
  tone: string;
};

export type ItemDetail = Item & {
  desc: string;
  photos: string[];
  seller: Person;
};

export type EventCategory = "Study" | "Casual" | "Social" | "Food";

export type MeetupEvent = {
  id: string;
  title: string;
  cat: EventCategory;
  /** Labels in Adelaide time, from the API: "TUE", "29", "7:00 pm", "Tue 29 Sep · 7:00–9:30 pm" */
  day: string;
  date: string;
  time: string;
  when: string;
  where: MapPoint & { name: string };
  /** Headcount including you (and the host) */
  going: number;
  cap: number;
  full: boolean;
  walkIns: boolean;
  /** You tapped Join (hosts count as going) */
  joined: boolean;
  host: boolean;
};

export type EventDetail = MeetupEvent & { desc: string };

export type ChatAbout = { type: "Flat" | "Item"; id: string };

export type ChatMessage = {
  id: string;
  from: "me" | "them" | "system";
  text: string;
  /** "About: …" lines link to the listing */
  about?: ChatAbout | null;
};

/** A row in Messages: one chat per pair of students */
export type ChatThread = {
  id: string;
  person: Person;
  preview: string;
  unread: number;
  lastAt: string;
};
