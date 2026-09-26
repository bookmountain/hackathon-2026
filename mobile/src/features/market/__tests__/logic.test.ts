import { ITEMS } from "@/test/fixtures";
import {
  availabilityShort,
  customPinItems,
  EMPTY_ITEM,
  itemProblem,
  itemRequest,
  itemsAtPickup,
  listItems,
  openingMessage,
  type ItemDraft,
} from "../logic";

const ids = (items: { id: string }[]) => items.map((i) => i.id);
const photo = { uri: "file:///lamp.jpg", contentType: "image/jpeg" };
const today = new Date(2026, 8, 27);

describe("listing filters", () => {
  it("keeps sold items in the grid but not on the map", () => {
    expect(ids(listItems(ITEMS, "All"))).toContain("m6");
    expect(ids(itemsAtPickup(ITEMS, "flinders-city-campus"))).toEqual(["m3"]);
  });

  it("filters by category and search text", () => {
    expect(ids(listItems(ITEMS, "Furniture"))).toEqual(["m2", "m5"]);
    expect(ids(listItems(ITEMS, "All", "  CHAIR "))).toEqual(["m5"]);
  });

  it("counts pickup items per category", () => {
    expect(itemsAtPickup(ITEMS, "barr-smith-library", "Textbooks")).toHaveLength(1);
    expect(itemsAtPickup(ITEMS, "barr-smith-library", "Tech")).toHaveLength(0);
  });

  it("shows own-pin items as map tags", () => {
    expect(ids(customPinItems(ITEMS, "All"))).toEqual(["m4", "m5"]);
    expect(ids(customPinItems(ITEMS, "Kitchen"))).toEqual(["m4"]);
  });
});

describe("copy", () => {
  it("shortens availability and writes the opening message", () => {
    expect(availabilityShort("Available from 1 Oct")).toBe("From 1 Oct");
    expect(openingMessage(ITEMS[0])).toBe("Hi! Is the calculus textbook still available?");
  });
});

describe("selling", () => {
  const ready: ItemDraft = { ...EMPTY_ITEM, photos: [photo], title: " Lamp ", price: "10", category: "Furniture", condition: "LikeNew" };

  it("needs a photo, title, price, category and condition", () => {
    expect(itemProblem(EMPTY_ITEM, today)).toBe("Add a photo, title and price");
    expect(itemProblem({ ...ready, category: null }, today)).toBe("Pick a category and condition");
    expect(itemProblem(ready, today)).toBeNull();
  });

  it("needs a future date for 'From' and a pin for your own spot", () => {
    expect(itemProblem({ ...ready, avail: "From", from: null }, today)).toBe("Pick a date after today");
    expect(itemProblem({ ...ready, avail: "From", from: today }, today)).toBe("Pick a date after today");
    expect(itemProblem({ ...ready, avail: "From", from: new Date(2026, 9, 1) }, today)).toBeNull();
    expect(itemProblem({ ...ready, pickup: "custom" }, today)).toBe("Drop your pin on the map");
  });

  it("posts at a safe pickup point", () => {
    expect(itemRequest(ready, "item-1", ["items/item-1/a.jpg"])).toEqual({
      id: "item-1",
      title: "Lamp",
      price: 10,
      description: null,
      category: "Furniture",
      condition: "LikeNew",
      conditionNote: null,
      availability: "Now",
      availableFrom: null,
      pickupPointId: "barr-smith-library",
      placeName: null,
      lat: null,
      lng: null,
      photoKeys: ["items/item-1/a.jpg"],
    });
  });

  it("posts at your own pin with a from-date", () => {
    const body = itemRequest(
      { ...ready, pickup: "custom", pin: { latitude: -34.925, longitude: 138.601 }, placeName: " Rundle St ", avail: "From", from: new Date(2026, 9, 1) },
      "item-1",
      [],
    );
    expect(body).toMatchObject({
      pickupPointId: null,
      placeName: "Rundle St",
      lat: -34.925,
      lng: 138.601,
      availability: "From",
      availableFrom: "2026-10-01",
    });
  });
});
