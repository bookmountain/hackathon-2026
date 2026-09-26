import { FLATS } from "@/data/seed";
import { buildFlat, EMPTY_ROOM, filterFlats, roomProblem, streetOf } from "../logic";

const ids = (flats: { id: string }[]) => flats.map((f) => f.id);

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
  it("asks for the pin first, then photos/title/rent", () => {
    expect(roomProblem(EMPTY_ROOM)).toBe("Pin your flat on the map");
    expect(roomProblem({ ...EMPTY_ROOM, pin: { latitude: -34.92, longitude: 138.6 } })).toBe("Add photos, title and rent");
    expect(roomProblem({ ...EMPTY_ROOM, pin: { latitude: -34.92, longitude: 138.6 }, photo: true, title: "Room", price: "200" })).toBeNull();
  });
});

describe("buildFlat", () => {
  it("fills defaults and marks the listing as mine", () => {
    const flat = buildFlat(
      { ...EMPTY_ROOM, photo: true, title: "  Bright room ", price: "220", pin: { latitude: -34.9199, longitude: 138.6043 } },
      { major: "Law", uni: "Flinders Uni" },
      "f-new",
    );
    expect(flat).toMatchObject({
      id: "f-new",
      title: "Bright room",
      area: "Adelaide · Pinned location",
      price: 220,
      bills: 0,
      tenant: "me",
      from: "Available now",
      minStay: "Flexible",
      feats: ["Ask the tenant"],
      tenants: ["Flinders Uni · Law (you)"],
      // Pinned right at Adelaide Uni: the 2-minute minimum
      walkA: 2,
      latitude: -34.9199,
      longitude: 138.6043,
    });
  });

  it("formats the move-in date", () => {
    const flat = buildFlat(
      { ...EMPTY_ROOM, photo: true, title: "Room", price: "200", pin: { latitude: -34.92, longitude: 138.6 }, from: new Date(2026, 9, 14) },
      { major: "", uni: "Adelaide Uni" },
      "f-new",
    );
    expect(flat.from).toBe("From 14 Oct");
    expect(flat.tenants).toEqual(["Adelaide Uni · Student (you)"]);
  });
});

describe("streetOf", () => {
  it("takes the part after the dot", () => {
    expect(streetOf("Adelaide CBD · Frome St")).toBe("Frome St");
    expect(streetOf("Somewhere")).toBe("Somewhere");
  });
});
