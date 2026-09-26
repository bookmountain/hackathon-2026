import { clockTime, dayMonth, eventWhen, parseDateOnly, timeAgo, toDateOnly, weekdayCaps } from "../dates";

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

describe("API dates", () => {
  it("round-trips a date-only value in local time", () => {
    expect(toDateOnly(parseDateOnly("2026-10-01"))).toBe("2026-10-01");
    expect(toDateOnly(new Date(2026, 0, 5, 23, 59))).toBe("2026-01-05");
  });

  it("says how long ago something was posted", () => {
    const now = new Date(2026, 8, 27, 12, 0);
    const ago = (ms: number) => new Date(now.getTime() - ms).toISOString();
    expect(timeAgo(ago(20_000), now)).toBe("Just now");
    expect(timeAgo(ago(5 * 60_000), now)).toBe("5m ago");
    expect(timeAgo(ago(2 * 3_600_000), now)).toBe("2h ago");
    expect(timeAgo(ago(3 * 86_400_000), now)).toBe("3d ago");
    expect(timeAgo(new Date(2026, 8, 1, 12).toISOString(), now)).toBe("1 Sep");
  });
});
