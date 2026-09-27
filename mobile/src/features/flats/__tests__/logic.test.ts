import { FLATS } from "@/test/fixtures";
import {
  activeFlatFilters,
  BILLS_SLIDER,
  countFlatFilters,
  EMPTY_FLAT_FILTERS,
  EMPTY_ROOM,
  filterFlats,
  flatRequest,
  housemateLine,
  RENT_SLIDER,
  roomProblem,
  sliderLimit,
  streetOf,
  type FlatFilters,
  type RoomDraft,
} from "../logic";

const ids = (flats: { id: string }[]) => flats.map((f) => f.id);
const photo = { uri: "file:///room.jpg", contentType: "image/jpeg" };
const pin = { latitude: -34.92, longitude: 138.6 };

describe("filterFlats", () => {
  // The fixtures all have 3 beds and 2 flatmates; vary them here
  const flats = [FLATS[0], { ...FLATS[1], beds: 1, members: 0 }, { ...FLATS[2], beds: 2, members: 4 }, FLATS[3]];
  const only = (change: Partial<FlatFilters>) => ids(filterFlats(flats, { ...EMPTY_FLAT_FILTERS, ...change }));

  it("returns everything with no filters", () => {
    expect(only({})).toEqual(["f1", "f2", "f3", "f4"]);
    expect(countFlatFilters(EMPTY_FLAT_FILTERS)).toBe(0);
  });

  it("caps rent and bills", () => {
    expect(only({ maxRent: 240 })).toEqual(["f3", "f4"]);
    expect(only({ maxBills: 20 })).toEqual(["f2", "f4"]);
  });

  it("filters bedrooms and flatmates", () => {
    expect(only({ minBeds: 2 })).toEqual(["f1", "f3", "f4"]);
    expect(only({ minBeds: 3 })).toEqual(["f1", "f4"]);
    expect(only({ maxMates: 1 })).toEqual(["f2"]);
    expect(only({ maxMates: 2 })).toEqual(["f1", "f2", "f4"]);
  });

  it("matches furnishing and toilet", () => {
    expect(only({ furnished: "Partly furnished" })).toEqual(["f2"]);
    expect(only({ furnished: "Unfurnished" })).toEqual([]);
    expect(only({ toilet: "Ensuite" })).toEqual(["f1", "f4"]);
    expect(only({ toilet: "Shared" })).toEqual(["f2", "f3"]);
  });

  it("combines filters with AND", () => {
    expect(only({ furnished: "Fully furnished", maxBills: 20 })).toEqual(["f4"]);
    expect(only({ toilet: "Shared", minBeds: 2 })).toEqual(["f3"]);
  });
});

describe("sliderLimit", () => {
  it("treats the top of the track as no limit", () => {
    expect(sliderLimit(250, RENT_SLIDER)).toBe(250);
    expect(sliderLimit(500, RENT_SLIDER)).toBeNull();
    expect(sliderLimit(0, BILLS_SLIDER)).toBe(0);
    expect(sliderLimit(60, BILLS_SLIDER)).toBeNull();
  });
});

describe("activeFlatFilters", () => {
  it("labels one chip per filter, each clearing only itself", () => {
    const f: FlatFilters = { maxRent: 250, maxBills: 30, minBeds: 2, furnished: "Fully furnished", toilet: "Ensuite", maxMates: 2 };
    const chips = activeFlatFilters(f);
    expect(chips.map((c) => c.label)).toEqual(["≤ $250/wk", "Bills ≤ $30", "2+ bed", "Fully furnished", "Ensuite toilet", "≤ 2 flatmates"]);
    expect(countFlatFilters(f)).toBe(6);
    expect({ ...f, ...chips[2].clear }).toEqual({ ...f, minBeds: 0 });
    // Clearing every chip gets back to no filters
    expect(chips.reduce((acc, c) => ({ ...acc, ...c.clear }), f)).toEqual(EMPTY_FLAT_FILTERS);
  });

  it("keeps a $0 bills cap and says flatmate for one", () => {
    expect(activeFlatFilters({ ...EMPTY_FLAT_FILTERS, maxBills: 0, maxMates: 1 }).map((c) => c.label)).toEqual(["Bills ≤ $0", "≤ 1 flatmate"]);
  });
});

describe("roomProblem", () => {
  it("asks for the pin, then photos/title/rent, then the suburb", () => {
    expect(roomProblem(EMPTY_ROOM)).toBe("Pin your flat on the map");
    expect(roomProblem({ ...EMPTY_ROOM, pin })).toBe("Add photos, title and rent");
    const ready: RoomDraft = { ...EMPTY_ROOM, pin, photos: [photo], title: "Room", price: "200" };
    expect(roomProblem(ready)).toBe("Add the suburb");
    expect(roomProblem({ ...ready, suburb: "Adelaide" })).toBeNull();
  });

  it("keeps rent in the API's range", () => {
    const draft: RoomDraft = { ...EMPTY_ROOM, pin, photos: [photo], title: "Room", suburb: "Adelaide", price: "20" };
    expect(roomProblem(draft)).toBe("Rent is $50–$2000 a week");
  });
});

describe("flatRequest", () => {
  it("builds the POST /api/flats body", () => {
    const body = flatRequest(
      {
        ...EMPTY_ROOM,
        pin,
        photos: [photo],
        title: "  Bright room ",
        street: " Frome St ",
        suburb: "Adelaide",
        price: "220",
        minStay: 6,
        from: new Date(2026, 9, 14),
      },
      { major: "Law", uni: "Flinders Uni" },
      "listing-1",
      ["flats/listing-1/a.jpg"],
    );
    expect(body).toEqual({
      id: "listing-1",
      title: "Bright room",
      description: null,
      suburb: "Adelaide",
      street: "Frome St",
      lat: -34.92,
      lng: 138.6,
      rentPerWeek: 220,
      billsPerWeek: 0,
      bedrooms: 3,
      flatmates: 2,
      toilet: "PrivateEnsuite",
      bathroom: "Ensuite",
      furnished: "Fully",
      minStayMonths: 6,
      availableFrom: "2026-10-14",
      features: [],
      houseRhythm: [],
      preferredFlatmate: null,
      housemates: ["Flinders · Law"],
      photoKeys: ["flats/listing-1/a.jpg"],
    });
  });

  it("keeps the housemate line within 60 characters", () => {
    expect(housemateLine({ major: "", uni: "Adelaide Uni" })).toBe("Adelaide · Student");
    expect(housemateLine({ major: "x".repeat(80), uni: "Adelaide Uni" })).toHaveLength(60);
  });
});

describe("streetOf", () => {
  it("takes the part after the dot", () => {
    expect(streetOf("Adelaide · Frome St")).toBe("Frome St");
    expect(streetOf("Somewhere")).toBe("Somewhere");
  });
});
