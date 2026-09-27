import { EVENT } from "@/test/fixtures";
import { bannerKey, dueReminders, reminderAlarms, toggleReminder } from "../reminders";

const now = new Date("2026-09-27T00:00:00Z");
const inDays = (d: number) => new Date(now.getTime() + d * 24 * 60 * 60 * 1000).toISOString();
const going = (id: string, days: number) => ({ ...EVENT, id, joined: true, startsAt: inDays(days) });

describe("toggleReminder", () => {
  it("adds and removes, keeping 2 days before 1 day", () => {
    expect(toggleReminder([], "1d")).toEqual(["1d"]);
    expect(toggleReminder(["1d"], "2d")).toEqual(["2d", "1d"]);
    expect(toggleReminder(["2d", "1d"], "2d")).toEqual(["1d"]);
  });
});

describe("reminderAlarms", () => {
  it("turns reminders into .ics triggers", () => {
    expect(reminderAlarms(["2d", "1d"])).toEqual(["P2D", "P1D"]);
    expect(reminderAlarms([])).toEqual([]);
  });
});

describe("dueReminders", () => {
  const labels = (list: ReturnType<typeof dueReminders>) => list.map((r) => `${r.event.id}:${r.label}`);

  it("says Tomorrow for a 1-day reminder 0–1 days out", () => {
    const due = dueReminders([going("a", 0.5), going("b", 1)], { a: ["1d"], b: ["1d"] }, [], now);
    expect(labels(due)).toEqual(["a:Tomorrow", "b:Tomorrow"]);
  });

  it("says In 2 days for a 2-day reminder 1–2 days out", () => {
    const due = dueReminders([going("a", 1.5), going("b", 2)], { a: ["2d"], b: ["2d", "1d"] }, [], now);
    expect(labels(due)).toEqual(["a:In 2 days", "b:In 2 days"]);
  });

  it("prefers Tomorrow when both are on and it's under a day away", () => {
    expect(labels(dueReminders([going("a", 0.4)], { a: ["2d", "1d"] }, [], now))).toEqual(["a:Tomorrow"]);
  });

  it("stays quiet outside the window, without the matching reminder, or once started", () => {
    const events = [going("far", 2.5), going("wrong", 0.5), going("past", -0.1), going("early", 1.5)];
    const choices = { far: ["2d" as const], wrong: ["2d" as const], past: ["1d" as const], early: ["1d" as const] };
    expect(dueReminders(events, choices, [], now)).toEqual([]);
  });

  it("skips events you've left and dismissed banners", () => {
    const events = [{ ...going("left", 0.5), joined: false }, going("seen", 0.5), going("new", 0.5)];
    const choices = { left: ["1d" as const], seen: ["1d" as const], new: ["1d" as const] };
    const due = dueReminders(events, choices, [bannerKey("seen", "Tomorrow")], now);
    expect(labels(due)).toEqual(["new:Tomorrow"]);
    expect(due[0].key).toBe("new:Tomorrow");
  });

  it("shows the Tomorrow banner even after the In 2 days one was dismissed", () => {
    const due = dueReminders([going("a", 0.9)], { a: ["2d", "1d"] }, [bannerKey("a", "In 2 days")], now);
    expect(labels(due)).toEqual(["a:Tomorrow"]);
  });
});
