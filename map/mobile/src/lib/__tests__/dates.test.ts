import { clockTime, dayMonth, eventWhen, weekdayCaps } from "../dates";

// Tuesday 29 September 2026, 7pm local time
const tuesdayEvening = new Date(2026, 8, 29, 19, 0);

describe("date labels", () => {
  it("formats like the design", () => {
    expect(dayMonth(tuesdayEvening)).toBe("29 Sep");
    expect(weekdayCaps(tuesdayEvening)).toBe("TUE");
    expect(clockTime(tuesdayEvening)).toBe("7:00 pm");
    expect(eventWhen(tuesdayEvening)).toBe("Tue 29 Sep · 7:00 pm");
  });

  it("handles midnight, noon and minutes", () => {
    expect(clockTime(new Date(2026, 0, 1, 0, 5))).toBe("12:05 am");
    expect(clockTime(new Date(2026, 0, 1, 12, 30))).toBe("12:30 pm");
  });
});
