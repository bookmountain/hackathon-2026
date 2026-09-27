// Shapes of the UCompass API (see README.md "Hosted API"). Enums are sent and
// received as names, never numbers. Dates are ISO strings.

export type University = "Adelaide" | "Flinders";
export type Gender = "Male" | "Female" | "NonBinary" | "Other" | "PreferNotToSay";

export type AuthResponse = {
  accessToken: string;
  expiresAt: string;
  consentComplete: boolean;
  onboardingComplete: boolean;
};

export type RegisterResponse = { userId: string; university: University; message: string; devCode: string | null };

export type DegreeSummary = { id: number; name: string; level: string; college: string };

export type Degree = DegreeSummary & { university: University; awardType: string; campuses: string[] };

export type Profile = {
  userId: string;
  displayName: string;
  university: University;
  degree: DegreeSummary | null;
  department: string;
  gender: Gender;
  pronouns: string | null;
  yearOfStudy: number | null;
  bio: string | null;
  habits: string[];
  interests: string[];
  avatarUrl: string | null;
  /** Send back on PUT /api/me/profile to keep the photo */
  avatarKey: string | null;
  /** Preset avatar colour (index into AVATAR_COLORS), null for none */
  avatarPreset: number | null;
  /** Not in the API yet: shape, ring and initials/icon for the preset avatar */
  avatarStyle?: AvatarStyle | null;
};

export type Me = {
  userId: string;
  email: string;
  university: University;
  consentComplete: boolean;
  profile: Profile | null;
};

export type ProfileRequest = {
  displayName: string;
  degreeId: number | null;
  gender: Gender;
  pronouns: string | null;
  yearOfStudy: number | null;
  bio: string | null;
  habits: string[];
  interests: string[];
  avatarKey: string | null;
  avatarPreset: number | null;
  /** Not in the API yet; ignored until it is (the app also keeps it on the device) */
  avatarStyle: AvatarStyle | null;
};

export type ConsentType = "Terms" | "Location" | "AgeAndEnrolment" | "UsageStats";

export type ConsentsResponse = {
  policyVersion: string;
  complete: boolean;
  items: { type: ConsentType; label: string; required: boolean; granted: boolean; at: string | null }[];
};

export type ConsentsRequest = { terms: boolean; location: boolean; ageAndEnrolment: boolean; usageStats: boolean };

/** What others see of a student: nickname, major, uni and avatar */
export type PersonDto = {
  userId: string;
  displayName: string;
  major: string | null;
  university: University;
  avatarUrl: string | null;
  avatarPreset: number | null;
  avatarStyle: AvatarStyle | null;
};

// Flats

export type ToiletType = "PrivateEnsuite" | "Shared";
export type BathroomType = "Ensuite" | "Shared";
export type Furnishing = "Fully" | "Partly" | "Unfurnished";

export type CampusWalk = { campusId: string; name: string; university: University; walkMinutes: number };

export type FlatSummaryDto = {
  id: string;
  title: string;
  suburb: string;
  street: string | null;
  lat: number;
  lng: number;
  rentPerWeek: number;
  billsPerWeek: number;
  totalPerWeek: number;
  bedrooms: number;
  flatmates: number;
  toilet: ToiletType;
  bathroom: BathroomType;
  furnished: Furnishing;
  availableFrom: string | null;
  coverPhotoUrl: string | null;
  walkToAdelaideUni: number;
  walkToFlindersCity: number;
  nearestCampuses: CampusWalk[];
  status: "Active" | "Taken";
  isMine: boolean;
  createdAt: string;
};

export type FlatDetailDto = {
  summary: FlatSummaryDto;
  description: string | null;
  minStayMonths: number | null;
  features: string[];
  houseRhythm: string[];
  preferredFlatmate: string | null;
  housemates: string[];
  photoUrls: string[];
  campuses: CampusWalk[];
  owner: PersonDto;
};

export type FlatRequest = {
  id: string | null;
  title: string;
  description: string | null;
  suburb: string;
  street: string | null;
  lat: number;
  lng: number;
  rentPerWeek: number;
  billsPerWeek: number;
  bedrooms: number;
  flatmates: number;
  toilet: ToiletType;
  bathroom: BathroomType;
  furnished: Furnishing;
  minStayMonths: number | null;
  availableFrom: string | null;
  features: string[];
  houseRhythm: string[];
  preferredFlatmate: string | null;
  housemates: string[];
  photoKeys: string[];
};

// Market

export type ItemCategoryValue = "Textbooks" | "Tech" | "Furniture" | "Kitchen" | "StudyGear";
export type ItemCondition = "New" | "LikeNew" | "Excellent" | "Good" | "Fair";
export type ItemAvailability = "Now" | "From" | "Pending" | "Sold";

export type PickupPointDto = { id: string; name: string; shortName: string; note: string; lat: number; lng: number };

export type ItemPickupDto = { pickupPointId: string | null; name: string | null; note: string | null; lat: number; lng: number };

export type ItemSummaryDto = {
  id: string;
  title: string;
  price: number;
  category: ItemCategoryValue;
  condition: ItemCondition;
  conditionNote: string | null;
  conditionLabel: string;
  availability: ItemAvailability;
  availableFrom: string | null;
  pickup: ItemPickupDto;
  coverPhotoUrl: string | null;
  isMine: boolean;
  createdAt: string;
};

export type ItemDetailDto = {
  summary: ItemSummaryDto;
  description: string | null;
  photoUrls: string[];
  seller: PersonDto;
};

export type ItemRequest = {
  id: string;
  title: string;
  price: number;
  description: string | null;
  category: ItemCategoryValue;
  condition: ItemCondition;
  conditionNote: string | null;
  availability: ItemAvailability;
  availableFrom: string | null;
  pickupPointId: string | null;
  placeName: string | null;
  lat: number | null;
  lng: number | null;
  photoKeys: string[];
};

// Meetups

export type EventTypeValue = "Study" | "Casual" | "Social" | "Food";

export type EventSummaryDto = {
  id: string;
  title: string;
  type: EventTypeValue;
  startsAt: string;
  endsAt: string | null;
  dayLabel: string;
  dateLabel: string;
  timeLabel: string;
  whenLabel: string;
  place: { placeId: string | null; name: string; note: string | null; lat: number; lng: number };
  capacity: number;
  goingCount: number;
  isFull: boolean;
  walkInsWelcome: boolean;
  isGoing: boolean;
  isHost: boolean;
  isHappeningNow: boolean;
  isOver: boolean;
  createdAt: string;
};

export type EventDetailDto = { summary: EventSummaryDto; description: string | null };

export type EventRequest = {
  title: string;
  type: EventTypeValue;
  startsAt: string;
  endsAt: string | null;
  description: string | null;
  placeId: string | null;
  placeName: string | null;
  lat: number | null;
  lng: number | null;
  capacity: number;
  walkInsWelcome: boolean;
};

// Chats

export type ChatAbout = { type: "Flat" | "Item"; id: string };

export type ChatMessageDto = {
  id: string;
  conversationId: string;
  senderId: string | null;
  isMine: boolean;
  kind: "Text" | "About";
  body: string;
  about: ChatAbout | null;
  createdAt: string;
};

export type ChatSummaryDto = {
  id: string;
  other: PersonDto;
  lastMessage: ChatMessageDto | null;
  unreadCount: number;
  lastMessageAt: string;
};

/** Send exactly one of userId, flatId or itemId */
/** One of userId, flatId, itemId or drawId (your Dcard match, which adds a "Daily card match · 27 Sep" line) */
export type StartChatRequest = { userId?: string; flatId?: string; itemId?: string; drawId?: string; text?: string };

// Uploads

export type PhotoUploadResponse = {
  uploadUrl: string;
  key: string;
  readUrl: string | null;
  expiresAt: string;
  /** Flat photos */
  listingId?: string;
  /** Item photos */
  itemId?: string;
};

// Not built in the API yet (see FRONTEND-GAPS.md, "Endpoints the v4 design needs").
// Until they exist the calls 404 and the app falls back (see isNotBuilt).

export type AvatarMode = "Initials" | "Icon";
export type AvatarShape = "Circle" | "Soft" | "Square";
export type AvatarRing = "None" | "Gold" | "Blue" | "Navy" | "Sky";
export type AvatarIcon = "Compass" | "Book" | "Coffee" | "Music" | "Code" | "Leaf" | "Camera" | "Ball" | "Paw" | "Rocket";

/** The avatar builder's look on top of avatarPreset (the colour). `text` "" = the nickname's first letter. */
export type AvatarStyle = { mode: AvatarMode; text: string; icon: AvatarIcon; shape: AvatarShape; ring: AvatarRing };

export type PhotoAnalysisKind = "Item" | "Room";

/** POST /api/ai/photo-analysis `{ kind, image }` (image = base64 JPEG, max side 640px) */
export type ItemPhotoAnalysis = {
  title: string;
  category: ItemCategoryValue;
  condition: ItemCondition;
  colour: string;
  texture: string;
  suggestedPrice: number;
  description: string;
  benefits: string[];
};

export type RoomPhotoAnalysis = {
  title: string;
  style: string;
  colours: string;
  furnished: Furnishing;
  /** Subset of the "List a room" feature options */
  features: string[];
  description: string;
  benefits: string[];
};

/** POST /api/items/image-search `{ image }`: a guessed category and the closest items */
export type ImageSearchResponse = { category: ItemCategoryValue | null; items: ItemSummaryDto[] };

export type DailyCardStatus = "Ready" | "Matched" | "Missed";

/** GET /api/daily-card, POST /api/daily-card/draw */
export type DailyCardDto = {
  status: DailyCardStatus;
  match: PersonDto | null;
  /** How many students have drawn today */
  drawnToday: number;
  /** Next Adelaide midnight, with a UTC offset: the deck resets and a missed-day lock ends */
  nextChangeAt: string;
  /** Ready after a day without drawing: pressing Draw locks the deck until midnight instead of dealing */
  missedDay: boolean;
  /** With Matched: send as drawId on POST /api/chats */
  drawId: string | null;
};
