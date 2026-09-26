import { CAMPUS, distanceMeters, offsetMeters, regionAround, walkMinutes } from "../geometry";

describe("distanceMeters", () => {
  it("measures Adelaide Uni → Flinders City Campus (~575 m, mostly east–west)", () => {
    const d = distanceMeters(CAMPUS.adelaide, CAMPUS.flindersCity);
    expect(d).toBeGreaterThan(550);
    expect(d).toBeLessThan(600);
  });
});

describe("walkMinutes", () => {
  it("rounds at ~80 m/min and never goes below 2", () => {
    expect(walkMinutes(CAMPUS.adelaide, CAMPUS.adelaide)).toBe(2);
    expect(walkMinutes(CAMPUS.adelaide, CAMPUS.flindersCity)).toBe(7);
  });
});

describe("offsetMeters", () => {
  it("moves roughly the requested distance", () => {
    const moved = offsetMeters(CAMPUS.adelaide, 30, 40);
    expect(distanceMeters(CAMPUS.adelaide, moved)).toBeCloseTo(50, 0);
  });
});

describe("regionAround", () => {
  it("centres a square region on the point", () => {
    expect(regionAround({ latitude: -34.9, longitude: 138.6 }, 0.01)).toEqual({
      latitude: -34.9,
      longitude: 138.6,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    });
  });
});
