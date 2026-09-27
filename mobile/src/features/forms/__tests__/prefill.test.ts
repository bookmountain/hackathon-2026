import type { EventDetailDto, FlatDetailDto, ItemDetailDto } from "@/api/types";
import { eventDto, flatDto, itemDto } from "@/test/fixtures";
import { eventForm, existingPhotos, itemForm, photoKeysFor, roomForm } from "../prefill";
import { toggleLevel } from "../studyLevels";

const person = { userId: "u1", displayName: "Koala_Kai", major: null, university: "Adelaide" as const, avatarUrl: null, avatarPreset: 3, avatarStyle: null };

describe("existingPhotos", () => {
  it("pairs each photo URL with its key, dropping ones without a key", () => {
    const { photos, keys } = existingPhotos(["https://r2/a?sig", "https://r2/b?sig"], ["items/m1/a.jpg"]);
    expect(photos).toEqual([{ uri: "https://r2/a?sig", contentType: "image/jpeg" }]);
    expect(keys).toEqual({ "https://r2/a?sig": "items/m1/a.jpg" });
  });
});

describe("photoKeysFor", () => {
  it("keeps existing keys and uploads only new photos, in order", async () => {
    const upload = jest.fn(async (p: { uri: string }) => `items/m1/${p.uri}`);
    const keys = await photoKeysFor(
      [
        { uri: "new1", contentType: "image/png" },
        { uri: "https://r2/a?sig", contentType: "image/jpeg" },
        { uri: "new2", contentType: "image/jpeg" },
      ],
      { "https://r2/a?sig": "items/m1/a.jpg" },
      upload,
    );
    expect(keys).toEqual(["items/m1/new1", "items/m1/a.jpg", "items/m1/new2"]);
    expect(upload).toHaveBeenCalledTimes(2);
  });
});

describe("eventForm", () => {
  it("fills a preset place, local date and time, and the kept levels", () => {
    const start = new Date(2026, 9, 3, 18, 30);
    const detail: EventDetailDto = { summary: eventDto({ startsAt: start.toISOString(), capacity: 12, walkInsWelcome: false }), description: "Bring a laptop" };
    const form = eventForm(detail, ["Postgrad"]);
    expect(form.draft).toMatchObject({
      title: "Stats cram — walk-ins welcome",
      cat: "Study",
      where: "barr-smith-library",
      pin: null,
      place: "",
      desc: "Bring a laptop",
      cap: 12,
      walkIn: false,
    });
    expect(form.draft.when?.getTime()).toBe(start.getTime());
    expect(form.dateText).toBe("03/10/2026");
    expect(form.time).toBe("18:30");
    expect(form.levels).toEqual(["Postgrad"]);
  });

  it("fills a dropped pin, leaving the default name blank, and Everyone without levels", () => {
    const place = { placeId: null, name: "Pinned location", note: null, lat: -34.93, lng: 138.6 };
    const form = eventForm({ summary: eventDto({ place }), description: null });
    expect(form.draft).toMatchObject({ where: "custom", pin: { latitude: -34.93, longitude: 138.6 }, place: "", desc: "" });
    expect(form.levels).toEqual(["Everyone"]);
    const named = eventForm({ summary: eventDto({ place: { ...place, name: "Rymill Park lake" } }), description: null });
    expect(named.draft.place).toBe("Rymill Park lake");
  });
});

describe("itemForm", () => {
  const detail = (over: Parameters<typeof itemDto>[0] = {}): ItemDetailDto => ({
    summary: itemDto({ isMine: true, ...over }),
    description: "Barely used",
    photoUrls: ["https://r2/1?sig", "https://r2/2?sig"],
    photoKeys: ["items/m1/1.jpg", "items/m1/2.jpg"],
    seller: person,
  });

  it("fills every field from a pickup-point item", () => {
    const form = itemForm(detail());
    expect(form.draft).toMatchObject({
      title: "Calculus textbook (Stewart, 8th ed.)",
      price: "35",
      desc: "Barely used",
      category: "Textbooks",
      condition: "Good",
      avail: "Now",
      from: null,
      pickup: "barr-smith-library",
      pin: null,
      placeName: "",
    });
    expect(form.draft.photos.map((p) => p.uri)).toEqual(["https://r2/1?sig", "https://r2/2?sig"]);
    expect(form.keys["https://r2/2?sig"]).toBe("items/m1/2.jpg");
    expect(form.sold).toBe(false);
  });

  it("fills a From date, an own pin and keeps Sold", () => {
    const pickup = { pickupPointId: null, name: "Rundle St East", note: null, lat: -34.92, lng: 138.61 };
    const from = itemForm(detail({ availability: "From", availableFrom: "2026-10-14", pickup }));
    expect(from.draft).toMatchObject({ avail: "From", pickup: "custom", pin: { latitude: -34.92, longitude: 138.61 }, placeName: "Rundle St East" });
    expect(from.fromText).toBe("14/10/2026");
    const sold = itemForm(detail({ availability: "Sold" }));
    expect(sold.sold).toBe(true);
    expect(sold.draft.avail).toBe("Now");
  });
});

describe("roomForm", () => {
  it("fills every field and keeps the housemates", () => {
    const detail: FlatDetailDto = {
      summary: flatDto({ isMine: true, billsPerWeek: 0 }),
      description: "Quiet street",
      minStayMonths: 6,
      features: ["Wi-Fi"],
      houseRhythm: ["Quiet after 10pm"],
      preferredFlatmate: null,
      housemates: ["Adelaide · Law"],
      photoUrls: ["https://r2/f?sig"],
      photoKeys: ["flats/f1/f.jpg"],
      campuses: [],
      owner: person,
    };
    const form = roomForm(detail);
    expect(form.draft).toMatchObject({
      title: "Sunny room, 6 min to North Tce",
      street: "Frome St",
      suburb: "Adelaide",
      pin: { latitude: -34.922, longitude: 138.607 },
      price: "245",
      bills: "",
      beds: 3,
      members: 2,
      toilet: "PrivateEnsuite",
      bath: "Ensuite",
      minStay: 6,
      furnished: "Fully",
      feats: ["Wi-Fi"],
      rhythm: ["Quiet after 10pm"],
      pref: "",
      desc: "Quiet street",
    });
    expect(form.fromText).toBe("14/10/2026");
    expect(form.stayText).toBe("6");
    expect(form.housemates).toEqual(["Adelaide · Law"]);
    expect(form.keys).toEqual({ "https://r2/f?sig": "flats/f1/f.jpg" });
  });
});

describe("toggleLevel", () => {
  it("makes Everyone exclusive and falls back to it when cleared", () => {
    expect(toggleLevel(["Everyone"], "PhD")).toEqual(["PhD"]);
    expect(toggleLevel(["PhD"], "Alumni")).toEqual(["PhD", "Alumni"]);
    expect(toggleLevel(["PhD", "Alumni"], "Everyone")).toEqual(["Everyone"]);
    expect(toggleLevel(["PhD"], "PhD")).toEqual(["Everyone"]);
  });
});
