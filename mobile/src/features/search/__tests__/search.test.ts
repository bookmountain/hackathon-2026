import type { Item } from "@/data/types";
import { guessCategory, imageSearchStatus, rankByImage } from "../imageSearch";
import { matchesQuery, resultsTitle } from "../query";

const place = { pickupId: "p", name: "Barr Smith Library", short: "Barr Smith", sub: "", latitude: 0, longitude: 0 };
const item = (id: string, cat: Item["cat"], avail = "Available now"): Item => ({
  id,
  title: id,
  price: 10,
  avail,
  cond: "Good",
  cat,
  loc: place,
  posted: "",
  photo: null,
  mine: false,
  tone: "#fff",
});

describe("matchesQuery", () => {
  it("matches any field, ignoring case and spaces", () => {
    expect(matchesQuery("  ENSUITE ", "Sunny room", "Ensuite in Frome St")).toBe(true);
    expect(matchesQuery("lamp", "Desk", null)).toBe(false);
    expect(matchesQuery("", "anything")).toBe(true);
  });
});

describe("resultsTitle", () => {
  it("counts results and names the query", () => {
    expect(resultsTitle(3, "room", "ensuite")).toBe("3 rooms for “ensuite”");
    expect(resultsTitle(1, "event", " ")).toBe("1 event nearby");
    expect(resultsTitle(4, "item", "", { loading: false })).toBe("4 similar items nearby");
    expect(resultsTitle(0, "item", "", { loading: true })).toBe("Analysing photo… nearby");
  });
});

describe("image search fallback", () => {
  it("guesses the category from the file name", () => {
    expect(guessCategory("IMG_desk-lamp.JPG")).toBe("Furniture");
    expect(guessCategory("calculus-notes.png")).toBe("Textbooks");
    expect(guessCategory("IMG_0042.heic")).toBeNull();
  });

  it("puts the guessed category first and leaves out sold items", () => {
    const items = [item("a1", "Tech"), item("b2", "Furniture"), item("c3", "Furniture", "Sold"), item("d4", "Kitchen"), item("e5", "Furniture")];
    const ranked = rankByImage(items, "Furniture");
    expect(ranked.slice(0, 2).map((i) => i.cat)).toEqual(["Furniture", "Furniture"]);
    expect(ranked.some((i) => i.id === "c3")).toBe(false);
    expect(ranked).toHaveLength(4);
    expect(rankByImage(items, null)).toHaveLength(4);
  });

  it("describes what it's doing", () => {
    expect(imageSearchStatus(true, null)).toBe("Looking for similar items…");
    expect(imageSearchStatus(false, "Tech")).toBe("Looks like: Tech");
    expect(imageSearchStatus(false, null)).toBe("Closest matches from the marketplace");
  });
});
