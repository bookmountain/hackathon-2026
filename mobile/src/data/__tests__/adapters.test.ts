import { ITEMS, NOW, PICKUPS, eventDto, flatDto, itemDto, messageDto } from "@/test/fixtures";
import { majorLabel, previewOf, toEvent, toFlat, toItem, toMessage, toThread } from "../adapters";

describe("majorLabel", () => {
  it("shows the subject, like the design's majors", () => {
    expect(majorLabel("Bachelor of Mathematics (Honours)")).toBe("Mathematics (Honours)");
    expect(majorLabel("Master of Data Science")).toBe("Data Science");
    expect(majorLabel("Bachelor of Laws / Bachelor of Arts")).toBe("Laws / Arts");
    expect(majorLabel("Graduate Certificate in Education")).toBe("Education");
    expect(majorLabel(null)).toBe("");
  });
});

describe("toFlat", () => {
  it("turns API values into the design's labels", () => {
    expect(toFlat(flatDto(), NOW)).toMatchObject({
      area: "Adelaide · Frome St",
      price: 245,
      bills: 25,
      toilet: "Private ensuite",
      bath: "Ensuite shower",
      furnished: "Fully furnished",
      from: "From 14 Oct",
      latitude: -34.922,
      longitude: 138.607,
      mine: false,
    });
  });

  it("says 'Available now' without a date or once the date has passed", () => {
    expect(toFlat(flatDto({ availableFrom: null }), NOW).from).toBe("Available now");
    expect(toFlat(flatDto({ availableFrom: "2026-09-01" }), NOW).from).toBe("Available now");
    expect(toFlat(flatDto({ street: null, suburb: "North Adelaide" }), NOW).area).toBe("North Adelaide");
  });
});

describe("toItem", () => {
  it("labels availability and category", () => {
    const [calculus, , ipad, riceCooker, , labCoat] = ITEMS;
    expect(calculus).toMatchObject({ avail: "Available now", cat: "Textbooks", cond: "Good — some highlighting", posted: "2h ago" });
    expect(ipad.avail).toBe("Pending");
    expect(riceCooker.avail).toBe("Available from 1 Oct");
    expect(labCoat).toMatchObject({ avail: "Sold", cat: "Study gear" });
  });

  it("uses the pickup point's short name, or the seller's pin name", () => {
    expect(ITEMS[0].loc).toMatchObject({ pickupId: "barr-smith-library", short: "Barr Smith", sub: "Main entrance, Adelaide Uni" });
    expect(ITEMS[3].loc).toMatchObject({ pickupId: null, name: "Rundle St East", short: "Rundle St East", sub: "" });
    // An unnamed own pin
    expect(ITEMS[4].loc.name).toBe("Seller's pinned spot");
  });

  it("falls back to the full name before pickup points have loaded", () => {
    expect(toItem(itemDto(), [], NOW).loc.short).toBe("Barr Smith Library");
    expect(PICKUPS).toHaveLength(3);
  });
});

describe("toEvent", () => {
  it("keeps the API's Adelaide-time labels and your state", () => {
    expect(toEvent(eventDto({ isGoing: true, goingCount: 16 }))).toMatchObject({
      cat: "Study",
      day: "TUE",
      date: "29",
      time: "7:00 pm",
      when: "Tue 29 Sep · 7:00–9:30 pm",
      where: { name: "Barr Smith Library, Level 2", latitude: -34.91888, longitude: 138.60448 },
      going: 16,
      cap: 30,
      joined: true,
      host: false,
    });
  });
});

describe("chat", () => {
  it("maps messages to me / them / the About line", () => {
    expect(toMessage(messageDto()).from).toBe("them");
    expect(toMessage(messageDto({ isMine: true })).from).toBe("me");
    expect(toMessage(messageDto({ kind: "About", senderId: null, body: "About: Calculus · $35", about: { type: "Item", id: "m1" } }))).toEqual({
      id: "msg1",
      from: "system",
      text: "About: Calculus · $35",
      about: { type: "Item", id: "m1" },
    });
  });

  it("previews the last message", () => {
    expect(previewOf(null)).toBe("Say hi");
    expect(previewOf(messageDto({ isMine: true, body: "See you there" }))).toBe("You: See you there");
    expect(
      toThread({
        id: "c1",
        other: { userId: "tom", displayName: "TomTheTutor", major: "Bachelor of Mathematics (Honours)", university: "Adelaide", avatarUrl: null },
        lastMessage: messageDto(),
        unreadCount: 2,
        lastMessageAt: "2026-09-26T12:19:58Z",
      }),
    ).toMatchObject({ person: { nick: "TomTheTutor", major: "Mathematics (Honours)", uni: "Adelaide Uni" }, unread: 2 });
  });
});
