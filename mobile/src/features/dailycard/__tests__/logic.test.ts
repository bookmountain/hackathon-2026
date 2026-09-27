import type { Person } from "@/data/types";
import {
  apiView,
  dayKey,
  demoDrawnToday,
  draw,
  formatClock,
  freshCard,
  localView,
  nextMidnight,
  rollOver,
  simulateMissed,
  type LocalCard,
} from "../logic";

const person = (id: string): Person => ({ id, nick: id, major: "Law", uni: "Flinders Uni", avatar: 1 });
const at = (y: number, m: number, d: number, h = 12) => new Date(y, m - 1, d, h);

describe("formatClock", () => {
  it("shows HH:MM:SS and never goes negative", () => {
    expect(formatClock(((3 * 60 + 4) * 60 + 5) * 1000 + 999)).toBe("03:04:05");
    expect(formatClock(-5000)).toBe("00:00:00");
  });
});

describe("nextMidnight", () => {
  it("is the start of tomorrow", () => {
    expect(nextMidnight(at(2026, 9, 27, 18))).toEqual(new Date(2026, 8, 28));
  });
});

describe("draw", () => {
  it("matches today and avoids the last match when it can", () => {
    const card: LocalCard = { ...freshCard, lastMatchId: "a" };
    const drawn = draw(card, [person("a"), person("b")], at(2026, 9, 27), () => 0);
    expect(drawn).toMatchObject({ status: "Matched", lastDrawDay: "2026-09-27", lastMatchId: "b" });
    expect(drawn.match?.id).toBe("b");
  });

  it("does nothing unless the deck is ready", () => {
    const matched = draw(freshCard, [person("a")], at(2026, 9, 27));
    expect(draw(matched, [person("b")], at(2026, 9, 27))).toBe(matched);
  });
});

describe("rollOver", () => {
  const matched = draw(freshCard, [person("a")], at(2026, 9, 27));

  it("keeps today's match until midnight", () => {
    expect(rollOver(matched, at(2026, 9, 27, 23))).toBe(matched);
  });

  it("opens a fresh deck the next day", () => {
    expect(rollOver(matched, at(2026, 9, 28, 8))).toMatchObject({ status: "Ready", match: null, lastMatchId: "a" });
  });

  it("locks for 48 hours after a whole day without a draw", () => {
    const rolled = rollOver(matched, at(2026, 9, 29, 8));
    expect(rolled.status).toBe("Missed");
    expect(rolled.lockUntil).toBe(new Date(2026, 8, 31).getTime());
  });

  it("reopens when the lock ends, without locking again", () => {
    const locked = simulateMissed(matched, at(2026, 9, 28));
    expect(rollOver(locked, at(2026, 9, 29, 23))).toBe(locked);
    expect(rollOver(locked, at(2026, 9, 30, 0))).toEqual({ ...freshCard, lastMatchId: "a" });
  });
});

describe("views", () => {
  it("counts down to midnight, or to the end of a lock", () => {
    const now = at(2026, 9, 27);
    expect(localView(freshCard, now).nextChangeAt).toEqual(new Date(2026, 8, 28));
    const locked = simulateMissed(freshCard, now);
    expect(localView(locked, now).nextChangeAt).toEqual(new Date(2026, 8, 29));
  });

  it("adds your own draw to the demo count", () => {
    const now = at(2026, 9, 27);
    const drawn = draw(freshCard, [person("a")], now);
    expect(localView(drawn, now).drawnToday).toBe(demoDrawnToday(now, false) + 1);
    expect(dayKey(now)).toBe("2026-09-27");
  });

  it("maps the API's card", () => {
    const view = apiView({
      status: "Matched",
      match: { userId: "u1", displayName: "MiaReads", major: "Bachelor of Nursing", university: "Flinders", avatarUrl: null, avatarPreset: 2 },
      drawnToday: 150,
      nextChangeAt: "2026-09-28T00:00:00+09:30",
    });
    expect(view.match).toMatchObject({ id: "u1", nick: "MiaReads", major: "Nursing", uni: "Flinders Uni" });
    expect(view.nextChangeAt.toISOString()).toBe("2026-09-27T14:30:00.000Z");
  });
});
