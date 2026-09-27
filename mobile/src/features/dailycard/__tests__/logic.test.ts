import type { Person } from "@/data/types";
import {
  apiView,
  dayKey,
  demoDrawnToday,
  draw,
  formatClock,
  freshCard,
  interestLabel,
  localView,
  missedDay,
  nextMidnight,
  rollOver,
  sharedLine,
  simulateMissed,
  yearLabel,
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

  it("is Ready but flags a missed day after a whole day without a draw", () => {
    const rolled = rollOver(matched, at(2026, 9, 29, 8));
    expect(rolled.status).toBe("Ready");
    expect(missedDay(rolled, at(2026, 9, 29, 8))).toBe(true);
  });
});

describe("missed day", () => {
  const matched = draw(freshCard, [person("a")], at(2026, 9, 27));

  it("never counts for a brand-new deck", () => {
    expect(missedDay(freshCard, at(2026, 9, 27))).toBe(false);
  });

  it("makes the next Draw lock the deck until midnight instead of dealing", () => {
    const skipped = rollOver(matched, at(2026, 9, 29, 22));
    const locked = draw(skipped, [person("b")], at(2026, 9, 29, 22));
    expect(locked).toMatchObject({ status: "Missed", match: null, lastDrawDay: "2026-09-29" });
    expect(locked.lockUntil).toBe(new Date(2026, 8, 30).getTime());
    expect(localView(locked, at(2026, 9, 29, 22)).nextChangeAt).toEqual(new Date(2026, 8, 30));
  });

  it("opens a normal deck at midnight, which can deal", () => {
    const locked = draw(rollOver(matched, at(2026, 9, 29, 22)), [], at(2026, 9, 29, 22));
    expect(rollOver(locked, at(2026, 9, 29, 23))).toBe(locked);
    const reopened = rollOver(locked, at(2026, 9, 30, 0));
    expect(reopened.status).toBe("Ready");
    expect(missedDay(reopened, at(2026, 9, 30, 0))).toBe(false);
    expect(draw(reopened, [person("b")], at(2026, 9, 30, 9)).status).toBe("Matched");
  });

  it("can be simulated for the demo", () => {
    const now = at(2026, 9, 27);
    const skipped = simulateMissed(matched, now);
    expect(skipped.status).toBe("Ready");
    expect(missedDay(skipped, now)).toBe(true);
    expect(draw(skipped, [person("b")], now).status).toBe("Missed");
  });
});

describe("views", () => {
  it("counts down to midnight", () => {
    const now = at(2026, 9, 27);
    expect(localView(freshCard, now).nextChangeAt).toEqual(new Date(2026, 8, 28));
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
      match: {
        userId: "u1",
        displayName: "MiaReads",
        major: "Bachelor of Nursing",
        university: "Flinders",
        avatarUrl: null,
        avatarPreset: 2,
        avatarStyle: { mode: "Icon", text: "", icon: "Leaf", shape: "Soft", ring: "Sky" },
      },
      drawnToday: 150,
      nextChangeAt: "2026-09-28T00:00:00+09:30",
      missedDay: false,
      drawId: "d1",
    });
    expect(view.match).toMatchObject({ id: "u1", nick: "MiaReads", major: "Nursing", uni: "Flinders Uni" });
    expect(view.drawId).toBe("d1");
    expect(view.match?.avatarStyle).toMatchObject({ icon: "Leaf", shape: "Soft" });
    expect(view.nextChangeAt.toISOString()).toBe("2026-09-27T14:30:00.000Z");
  });
});

describe("match card labels", () => {
  it("turns interest tags into words", () => {
    expect(interestLabel("board-games")).toBe("Board games");
    expect(interestLabel("coding")).toBe("Coding");
  });

  it("names the year of study", () => {
    expect([1, 2, 3, 4, 11, 12, 21].map(yearLabel)).toEqual([
      "1st year",
      "2nd year",
      "3rd year",
      "4th year",
      "11th year",
      "12th year",
      "21st year",
    ]);
  });

  it("says what you have in common", () => {
    expect(sharedLine([])).toBeNull();
    expect(sharedLine(["coffee"])).toBe("You both like Coffee");
    expect(sharedLine(["coffee", "hiking", "anime", "art"])).toBe("You both like Coffee & Hiking +2");
  });
});
