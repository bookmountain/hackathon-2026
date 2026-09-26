import { ITEMS } from "@/data/seed";
import {
  availabilityShort,
  buildItem,
  customPinItems,
  EMPTY_ITEM,
  itemProblem,
  itemsAtPickup,
  listItems,
  openingMessage,
} from "../logic";

const ids = (items: { id: string }[]) => items.map((i) => i.id);

describe("listing filters", () => {
  it("keeps sold items in the grid but not on the map", () => {
    expect(ids(listItems(ITEMS, "All"))).toContain("m6");
    expect(ids(itemsAtPickup(ITEMS, "fcc"))).toEqual(["m3"]);
  });

  it("filters by category and search text", () => {
    expect(ids(listItems(ITEMS, "Furniture"))).toEqual(["m2", "m5"]);
    expect(ids(listItems(ITEMS, "All", "  CHAIR "))).toEqual(["m5"]);
  });

  it("counts pickup items per category", () => {
    expect(itemsAtPickup(ITEMS, "bsl", "Textbooks")).toHaveLength(1);
    expect(itemsAtPickup(ITEMS, "bsl", "Tech")).toHaveLength(0);
  });

  it("shows custom-pin items as map tags", () => {
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
  it("needs a photo, title and price", () => {
    expect(itemProblem(EMPTY_ITEM)).toBe("Add a photo, title and price");
    expect(itemProblem({ ...EMPTY_ITEM, photo: true, title: "Lamp", price: "10" })).toBeNull();
  });

  it("builds a listing at a safe pickup point", () => {
    const item = buildItem({ ...EMPTY_ITEM, photo: true, title: " Lamp ", price: "10" }, "m-new");
    expect(item).toMatchObject({ id: "m-new", title: "Lamp", price: 10, loc: "bsl", seller: "me", avail: "Available now" });
  });

  it("uses the dropped pin and a from-date when chosen", () => {
    const item = buildItem(
      {
        ...EMPTY_ITEM,
        photo: true,
        title: "Desk",
        price: "30",
        pickup: "custom",
        pin: { latitude: -34.925, longitude: 138.601 },
        avail: "Available from",
        from: new Date(2026, 9, 1),
      },
      "m-new",
    );
    expect(item.loc).toEqual({ name: "Your pinned spot", latitude: -34.925, longitude: 138.601 });
    expect(item.avail).toBe("Available from 1 Oct");
  });
});
