// Domain types. Locations are real WGS84 coordinates in the Adelaide CBD.

export type Uni = "Adelaide Uni" | "Flinders Uni";

export type Person = {
  id: string;
  nick: string;
  major: string;
  uni: Uni;
  /** Index into AVATAR_COLORS; -1 = no avatar */
  avatar: number;
};

export type MapPoint = { latitude: number; longitude: number };

/** Staffed, well-lit spots suggested for handovers and meetups */
export type Pickup = MapPoint & {
  id: string;
  name: string;
  short: string;
  sub: string;
};

/** A place that is either one of the safe pickups (by id) or a custom pin */
export type Place = string | (MapPoint & { name: string });

/** "me" marks listings made by the signed-in user */
export type OwnerId = string | "me";

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
  minStay: string;
  furnished: string;
  pref: string;
  feats: string[];
  walkA: number;
  walkF: number;
  tenant: OwnerId;
  from: string;
  tenants: string[];
  rhythm: string[];
  tone: string;
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
  seller: OwnerId;
  posted: string;
  desc: string;
  tone: string;
};

export type EventCategory = "Study" | "Casual" | "Social" | "Food";

export type MeetupEvent = {
  id: string;
  title: string;
  cat: EventCategory;
  day: string;
  date: string;
  time: string;
  when: string;
  where: MapPoint & { name: string };
  going: number;
  cap: number;
  desc: string;
};

export type ChatMessage = { from: "me" | "them" | "system"; text: string };

/** Which canned replies the other person uses in the demo */
export type ChatTopic = "study" | "flat" | "item" | "person";
