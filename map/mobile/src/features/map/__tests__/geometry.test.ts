import { CAMPUS, focusViewBox, PICKER_VIEWBOX, touchToMap, viewBoxString, walkMinutes } from "../geometry";

describe("touchToMap", () => {
  it("maps view pixels into the view box", () => {
    // A 195 × 195 view of the square picker (0 40 390 390): scale 2
    expect(touchToMap({ x: 100, y: 50 }, { width: 195, height: 195 }, PICKER_VIEWBOX.square)).toEqual({ x: 200, y: 140 });
  });

  it("maps the corners of the wide picker", () => {
    const size = { width: 390, height: 230 };
    expect(touchToMap({ x: 0, y: 0 }, size, PICKER_VIEWBOX.wide)).toEqual({ x: 0, y: 130 });
    expect(touchToMap({ x: 390, y: 230 }, size, PICKER_VIEWBOX.wide)).toEqual({ x: 390, y: 360 });
  });
});

describe("focusViewBox", () => {
  it("centres a 240 × 120 window on the point", () => {
    expect(viewBoxString(focusViewBox({ x: 292, y: 212 }))).toBe("172 152 240 120");
  });
});

describe("walkMinutes", () => {
  it("matches the design's estimate and never goes below 2", () => {
    expect(walkMinutes({ x: 264, y: 195 }, CAMPUS.adelaide)).toBe(2);
    expect(walkMinutes({ x: 320, y: 280 }, CAMPUS.adelaide)).toBe(9);
  });
});
