// One function per API endpoint the app uses. Details in README.md.
import { api } from "./client";
import type {
  AuthResponse,
  ChatMessageDto,
  ChatSummaryDto,
  ConsentsRequest,
  ConsentsResponse,
  Degree,
  EventDetailDto,
  EventRequest,
  EventSummaryDto,
  FlatDetailDto,
  FlatRequest,
  FlatSummaryDto,
  ItemAvailability,
  ItemDetailDto,
  ItemRequest,
  ItemSummaryDto,
  Me,
  PhotoUploadResponse,
  PickupPointDto,
  Profile,
  ProfileRequest,
  RegisterResponse,
  StartChatRequest,
  University,
} from "./types";

export const auth = {
  register: (email: string, password: string) =>
    api<RegisterResponse>("/api/auth/register", { method: "POST", body: { email, password } }),
  verify: (email: string, code: string) => api<AuthResponse>("/api/auth/verify", { method: "POST", body: { email, code } }),
  resendCode: (email: string) => api<void>("/api/auth/resend-code", { method: "POST", body: { email } }),
  login: (email: string, password: string) =>
    api<AuthResponse>("/api/auth/login", { method: "POST", body: { email, password } }),
};

export const me = {
  get: () => api<Me>("/api/me"),
  saveProfile: (profile: ProfileRequest) => api<Profile>("/api/me/profile", { method: "PUT", body: profile }),
  /** Deletes the account and everything in it */
  deleteAccount: () => api<void>("/api/me", { method: "DELETE" }),
  getConsents: () => api<ConsentsResponse>("/api/consents"),
  saveConsents: (consents: ConsentsRequest) => api<ConsentsResponse>("/api/consents", { method: "PUT", body: consents }),
};

export const degrees = {
  search: (university: University, search: string) =>
    api<Degree[]>("/api/degrees", { query: { university, search: search.trim() || undefined } }),
};

export const flats = {
  list: () => api<FlatSummaryDto[]>("/api/flats", { query: { sort: "newest" } }),
  get: (id: string) => api<FlatDetailDto>(`/api/flats/${id}`),
  create: (flat: FlatRequest) => api<FlatDetailDto>("/api/flats", { method: "POST", body: flat }),
};

export const items = {
  /** Sold items are included: the grid shows them faded, the map filters them out */
  list: () => api<ItemSummaryDto[]>("/api/items", { query: { includeSold: true, sort: "newest" } }),
  pickupPoints: () => api<PickupPointDto[]>("/api/items/pickup-points"),
  get: (id: string) => api<ItemDetailDto>(`/api/items/${id}`),
  create: (item: ItemRequest) => api<ItemDetailDto>("/api/items", { method: "POST", body: item }),
  setAvailability: (id: string, availability: ItemAvailability, availableFrom: string | null = null) =>
    api<void>(`/api/items/${id}/availability`, { method: "PUT", body: { availability, availableFrom } }),
};

export const events = {
  list: () => api<EventSummaryDto[]>("/api/events"),
  get: (id: string) => api<EventDetailDto>(`/api/events/${id}`),
  create: (event: EventRequest) => api<EventDetailDto>("/api/events", { method: "POST", body: event }),
  join: (id: string) => api<EventSummaryDto>(`/api/events/${id}/join`, { method: "POST" }),
  leave: (id: string) => api<EventSummaryDto>(`/api/events/${id}/join`, { method: "DELETE" }),
};

export const chats = {
  list: () => api<ChatSummaryDto[]>("/api/chats"),
  start: (req: StartChatRequest) => api<ChatSummaryDto>("/api/chats", { method: "POST", body: req }),
  messages: (id: string) => api<ChatMessageDto[]>(`/api/chats/${id}/messages`, { query: { limit: 100 } }),
  send: (id: string, text: string) => api<ChatMessageDto>(`/api/chats/${id}/messages`, { method: "POST", body: { text } }),
  markRead: (id: string) => api<void>(`/api/chats/${id}/read`, { method: "POST" }),
};

export const uploads = {
  flatPhoto: (contentType: string, listingId: string | null) =>
    api<PhotoUploadResponse>("/api/uploads/flat-photo", { method: "POST", body: { contentType, listingId } }),
  itemPhoto: (contentType: string, itemId: string | null) =>
    api<PhotoUploadResponse>("/api/uploads/item-photo", { method: "POST", body: { contentType, itemId } }),
};
