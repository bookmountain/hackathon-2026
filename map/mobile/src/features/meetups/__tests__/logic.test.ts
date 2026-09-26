import { EVENTS } from "@/data/seed";
import { buildEvent, EMPTY_EVENT, eventProblem, fillPercent, goingCount } from "../logic";

describe("headcount", () => {
  it("adds you once joined", () => {
    expect(goingCount(EVENTS[0], false)).toBe(14);
    expect(goingCount(EVENTS[0], true)).toBe(15);
    expect(fillPercent(EVENTS[0], true)).toBe(50);
  });
});

describe("eventProblem", () => {
  it("needs a name, and a pin for custom places", () => {
    expect(eventProblem(EMPTY_EVENT)).toBe("Give your event a name");
    expect(eventProblem({ ...EMPTY_EVENT, title: "Coffee", where: "custom" })).toBe("Pin the location on the map");
    expect(eventProblem({ ...EMPTY_EVENT, title: "Coffee" })).toBeNull();
  });
});

describe("buildEvent", () => {
  const now = new Date(2026, 8, 26, 16, 0); // Sat 26 Sep 2026, 4pm

  it("places central events just off the pickup and defaults to two days out", () => {
    const event = buildEvent({ ...EMPTY_EVENT, title: " Coffee & code " }, "e-new", now);
    expect(event).toMatchObject({
      id: "e-new",
      title: "Coffee & code",
      day: "MON",
      date: "28",
      time: "4:00 pm",
      when: "Mon 28 Sep · 4:00 pm",
      where: { name: "Barr Smith Library", x: 306, y: 230 },
      going: 0,
      cap: 20,
      desc: "Hosted anonymously. Walk-ins welcome.",
    });
  });

  it("uses a dropped pin and its name", () => {
    const event = buildEvent(
      { ...EMPTY_EVENT, title: "Picnic", where: "custom", pin: { x: 120, y: 480 }, place: "Rymill Park", walkIn: false },
      "e-new",
      now,
    );
    expect(event.where).toEqual({ name: "Rymill Park", x: 120, y: 480 });
    expect(event.desc).toBe("Hosted anonymously. RSVP to join.");
  });
});
