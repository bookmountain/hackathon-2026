import { EVENT } from "@/test/fixtures";
import { EMPTY_EVENT, eventProblem, eventRequest, fillPercent, joinLabel } from "../logic";

const now = new Date(2026, 8, 26, 16, 0); // Sat 26 Sep 2026, 4pm
const later = new Date(2026, 8, 29, 19, 0);

describe("headcount", () => {
  it("fills the bar from the API's count", () => {
    expect(fillPercent(EVENT)).toBe(50);
  });

  it("labels the Join toggle", () => {
    expect(joinLabel(EVENT)).toBe("Join");
    expect(joinLabel({ ...EVENT, joined: true })).toBe("Going ✓");
    expect(joinLabel({ ...EVENT, full: true })).toBe("Full");
    expect(joinLabel({ ...EVENT, full: true, joined: true })).toBe("Going ✓");
    expect(joinLabel({ ...EVENT, host: true, joined: true })).toBe("Hosting");
  });
});

describe("eventProblem", () => {
  it("needs a name, a future time, and a pin for custom places", () => {
    expect(eventProblem(EMPTY_EVENT, now)).toBe("Give your event a name");
    expect(eventProblem({ ...EMPTY_EVENT, title: "Coffee" }, now)).toBe("Pick a date & time");
    expect(eventProblem({ ...EMPTY_EVENT, title: "Coffee", when: new Date(2026, 8, 26, 9) }, now)).toBe("Pick a time in the future");
    expect(eventProblem({ ...EMPTY_EVENT, title: "Coffee", when: later, where: "custom" }, now)).toBe("Pin the location on the map");
    expect(eventProblem({ ...EMPTY_EVENT, title: "Coffee", when: later }, now)).toBeNull();
  });
});

describe("eventRequest", () => {
  it("sends a preset place by id and the start as an instant", () => {
    expect(eventRequest({ ...EMPTY_EVENT, title: " Coffee & code ", when: later })).toEqual({
      title: "Coffee & code",
      type: "Study",
      startsAt: later.toISOString(),
      endsAt: null,
      description: null,
      placeId: "barr-smith-library",
      placeName: null,
      lat: null,
      lng: null,
      capacity: 20,
      walkInsWelcome: true,
    });
  });

  it("sends a dropped pin with its name", () => {
    const body = eventRequest({
      ...EMPTY_EVENT,
      title: "Picnic",
      when: later,
      where: "custom",
      pin: { latitude: -34.9235, longitude: 138.6155 },
      place: "Rymill Park",
      walkIn: false,
    });
    expect(body).toMatchObject({ placeId: null, placeName: "Rymill Park", lat: -34.9235, lng: 138.6155, walkInsWelcome: false });
  });
});
