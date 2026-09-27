import type { Item, ItemCategory } from "@/data/types";
import { EVENT } from "@/test/fixtures";
import { EMPTY_PERSONA, type Persona } from "../logic";
import { recommendEvents, recommendItems, scoreEvent } from "../recommend";

const persona = (p: Partial<Persona>): Persona => ({ ...EMPTY_PERSONA, ...p });

const coffee = { ...EVENT, id: "coffee", cat: "Casual" as const, title: "Flat white crawl" };
const gaming = { ...EVENT, id: "gaming", cat: "Social" as const, title: "Smash Bros night" };
const study = { ...EVENT, id: "study", cat: "Study" as const, title: "Stats cram" };
const food = { ...EVENT, id: "food", cat: "Food" as const, title: "Dumpling making" };

describe("scoreEvent", () => {
  it("scores an interest whose type matches", () => {
    expect(scoreEvent(coffee, persona({ interests: ["Coffee"] }), "")).toMatchObject({
      score: 2,
      reason: "Because you like Coffee",
    });
  });

  it("keeps the first type-match reason", () => {
    expect(scoreEvent(coffee, persona({ interests: ["Gym", "Coffee"] }), "")).toMatchObject({
      score: 4,
      reason: "Because you like Gym",
    });
  });

  it("lets an interest named in the text override the reason", () => {
    const pick = scoreEvent({ ...gaming, title: "Gaming and music jam" }, persona({ interests: ["Gaming", "Music"] }), "");
    // Gaming: type +2, text +2; Music: type +2, text +2
    expect(pick).toMatchObject({ score: 8, reason: "Because you like Music" });
  });

  it("matches singular words and the description", () => {
    const pick = scoreEvent({ ...food, desc: "Join our study group after" }, persona({ interests: ["Study groups"] }), "");
    expect(pick).toMatchObject({ score: 2, reason: "Because you like Study groups" });
  });

  it("falls back to a goal reason", () => {
    expect(scoreEvent(food, persona({ goals: ["explore", "friends"] }), "")).toMatchObject({
      score: 1,
      reason: "For your goal: Just exploring",
    });
    expect(scoreEvent(food, persona({ goals: ["market"] }), "").score).toBe(0);
  });

  it("adds a point for your major on Study events that already scored", () => {
    expect(scoreEvent(study, persona({ goals: ["study"] }), "Computer Science")).toMatchObject({
      score: 2,
      reason: "For your goal: Study buddies",
    });
    expect(scoreEvent(study, EMPTY_PERSONA, "Computer Science").score).toBe(0);
    expect(scoreEvent(study, persona({ goals: ["study"] }), "").score).toBe(1);
  });
});

describe("recommendEvents", () => {
  it("returns nothing without a persona", () => {
    expect(recommendEvents([coffee, gaming, study, food], EMPTY_PERSONA, "Law")).toEqual([]);
  });

  it("skips joined events, drops zero scores and sorts best first", () => {
    const picks = recommendEvents(
      [coffee, gaming, { ...study, joined: true }, food],
      persona({ interests: ["Gaming", "Music", "Coffee"], goals: ["friends"] }),
      "",
    );
    expect(picks.map((p) => [p.event.id, p.score, p.reason])).toEqual([
      ["gaming", 5, "Because you like Gaming"],
      ["coffee", 3, "Because you like Coffee"],
    ]);
  });

  it("keeps the top four", () => {
    const many = Array.from({ length: 6 }, (_, n) => ({ ...coffee, id: `c${n}` }));
    expect(recommendEvents(many, persona({ interests: ["Coffee"] }), "")).toHaveLength(4);
  });
});

describe("recommendItems", () => {
  const item = (id: string, cat: ItemCategory, avail = "Available now"): Item => ({
    id,
    title: id,
    price: 10,
    avail,
    cond: "Good",
    cat,
    loc: { id: "bsl", name: "Barr Smith", latitude: 0, longitude: 0, pickupId: "bsl" } as unknown as Item["loc"],
    posted: "Today",
    photo: null,
    mine: false,
    tone: "#E3E5FF",
  });
  const items = [
    item("pan", "Kitchen"),
    item("sold-pan", "Kitchen", "Sold"),
    item("desk", "Furniture"),
    item("book", "Textbooks"),
    item("mat", "Study gear"),
  ];

  it("needs an interest with a market category", () => {
    expect(recommendItems(items, EMPTY_PERSONA)).toEqual([]);
    expect(recommendItems(items, persona({ interests: ["Anime"] }))).toEqual([]);
  });

  it("picks unsold items in the matching categories, in list order", () => {
    const ids = recommendItems(items, persona({ interests: ["Hiking", "Cooking"] })).map((i) => i.id);
    expect(ids).toEqual(["pan", "mat"]);
  });

  it("stops at four", () => {
    const books = Array.from({ length: 6 }, (_, n) => item(`b${n}`, "Textbooks"));
    expect(recommendItems(books, persona({ interests: ["Study groups"] }))).toHaveLength(4);
  });
});
