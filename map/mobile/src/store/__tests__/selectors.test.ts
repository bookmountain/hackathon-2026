import { resolvePlace, selectHasUnread, selectMe, uniOfEmail } from "../selectors";
import { initialState } from "../state";

describe("uniOfEmail", () => {
  it("detects Flinders and defaults to Adelaide", () => {
    expect(uniOfEmail("chan0042@flinders.edu.au")).toBe("Flinders Uni");
    expect(uniOfEmail("a1234567@student.adelaide.edu.au")).toBe("Adelaide Uni");
  });
});

describe("resolvePlace", () => {
  it("expands a pickup id into the safe pickup point", () => {
    expect(resolvePlace("bsl")).toMatchObject({ name: "Barr Smith Library", short: "Barr Smith", central: true });
  });

  it("keeps custom pins as seller-chosen places", () => {
    expect(resolvePlace({ name: "Pulteney St", x: 304, y: 528 })).toEqual({
      name: "Pulteney St",
      short: "Pulteney St",
      sub: "",
      x: 304,
      y: 528,
      central: false,
    });
  });

  it("throws on an unknown pickup id", () => {
    expect(() => resolvePlace("nowhere")).toThrow('Unknown pickup point "nowhere"');
  });
});

describe("selectMe / selectHasUnread", () => {
  it("falls back to 'You' before a nickname is set", () => {
    expect(selectMe(initialState)).toMatchObject({ id: "me", nick: "You", avatar: -1 });
  });

  it("starts with the seeded unread message", () => {
    expect(selectHasUnread(initialState)).toBe(true);
  });
});
