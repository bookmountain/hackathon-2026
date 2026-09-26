import { FLATS } from "@/test/fixtures";
import { EMPTY_ROOM, filterFlats, flatRequest, housemateLine, roomProblem, streetOf, type RoomDraft } from "../logic";

const ids = (flats: { id: string }[]) => flats.map((f) => f.id);
const photo = { uri: "file:///room.jpg", contentType: "image/jpeg" };
const pin = { latitude: -34.92, longitude: 138.6 };

describe("filterFlats", () => {
  it("returns everything with no filters", () => {
    expect(ids(filterFlats(FLATS, []))).toEqual(["f1", "f2", "f3", "f4"]);
  });

  it("combines filters with AND", () => {
    expect(ids(filterFlats(FLATS, ["Under $250"]))).toEqual(["f1", "f3", "f4"]);
    expect(ids(filterFlats(FLATS, ["Under $250", "Ensuite"]))).toEqual(["f1", "f4"]);
    expect(ids(filterFlats(FLATS, ["Furnished", "Bills < $30"]))).toEqual(["f1", "f4"]);
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
