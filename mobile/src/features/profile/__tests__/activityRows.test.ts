import { toFlat } from "@/data/adapters";
import { EVENT, flatDto, ITEMS, NOW } from "@/test/fixtures";
import { countLabel, deletedToast, eventRow, EVENT_THUMB, flatRow, itemRow } from "../activityRows";
import { deleteConfirmed } from "../deleteAccount";

describe("My activity rows", () => {
  it("lets you edit and delete events you host, and only leave ones you joined", () => {
    const hosting = eventRow({ ...EVENT, host: true, joined: true });
    expect(hosting).toMatchObject({ tag: "Hosting", canEdit: true, deleteLabel: "Delete", photo: EVENT_THUMB });
    expect(hosting.sub).toBe("Tue 29 Sep · 7:00–9:30 pm · Barr Smith Library, Level 2");
    expect(deletedToast(hosting)).toBe("Event deleted");

    const going = eventRow({ ...EVENT, joined: true });
    expect(going).toMatchObject({ tag: "Going", canEdit: false, deleteLabel: "Leave" });
    expect(deletedToast(going)).toBe("You've left Stats cram — walk-ins welcome");
  });

  it("shows a room's rent, area and availability, or Taken", () => {
    const row = flatRow(toFlat(flatDto({ isMine: true }), NOW));
    expect(row).toMatchObject({ sub: "$245/wk · Adelaide · Frome St", tag: "From 14 Oct", canEdit: true });
    expect(flatRow(toFlat(flatDto({ status: "Taken" }), NOW)).tag).toBe("Taken");
    expect(deletedToast(row)).toBe("Room deleted");
  });

  it("shows an item's price, pickup and availability, greyed when sold", () => {
    const row = itemRow(ITEMS[0]);
    expect(row).toMatchObject({ sub: "$35 · Barr Smith", tag: "Available now" });
    const sold = itemRow(ITEMS[5]);
    expect(sold.tag).toBe("Sold");
    expect(sold.tagBg).not.toBe(row.tagBg);
    expect(deletedToast(row)).toBe("Listing deleted");
  });

  it("hides a zero count", () => {
    expect(countLabel(0)).toBe("");
    expect(countLabel(3)).toBe("3");
  });
});

describe("deleteConfirmed", () => {
  it("needs DELETE, in any case", () => {
    expect(deleteConfirmed("")).toBe(false);
    expect(deleteConfirmed("DELET")).toBe(false);
    expect(deleteConfirmed(" delete ")).toBe(true);
  });
});
