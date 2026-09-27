import { atTime, formatAuDate, maskAuDate, parseAuDate } from "../auDate";

describe("maskAuDate", () => {
  it("keeps digits and adds the slashes as you type", () => {
    expect(maskAuDate("1")).toBe("1");
    expect(maskAuDate("141")).toBe("14/1");
    expect(maskAuDate("1410")).toBe("14/10");
    expect(maskAuDate("14102")).toBe("14/10/2");
    expect(maskAuDate("14/10/2026")).toBe("14/10/2026");
    expect(maskAuDate("14a10b2026999")).toBe("14/10/2026");
  });
});

describe("parseAuDate", () => {
  it("reads real dates only", () => {
    expect(parseAuDate("14/10/2026")).toEqual(new Date(2026, 9, 14));
    expect(parseAuDate("29/02/2028")).toEqual(new Date(2028, 1, 29));
    expect(parseAuDate("31/02/2026")).toBeNull();
    expect(parseAuDate("14/13/2026")).toBeNull();
    expect(parseAuDate("14/10/26")).toBeNull();
    expect(parseAuDate("")).toBeNull();
  });

  it("round-trips with formatAuDate", () => {
    expect(formatAuDate(new Date(2026, 0, 5))).toBe("05/01/2026");
    expect(parseAuDate(formatAuDate(new Date(2026, 0, 5)))).toEqual(new Date(2026, 0, 5));
  });
});

describe("atTime", () => {
  const day = new Date(2026, 9, 14);
  it("sets the time, defaulting to 6pm", () => {
    expect(atTime(day, "09:30")).toEqual(new Date(2026, 9, 14, 9, 30));
    expect(atTime(day, "")).toEqual(new Date(2026, 9, 14, 18, 0));
    expect(atTime(day, "25:00")).toBeNull();
  });
});
