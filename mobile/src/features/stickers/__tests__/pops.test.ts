import { celebrates, POPS, randomPop, TAB_POPS } from "../pops";

describe("celebrates", () => {
  it.each(["Room published", "Listed! Buyers can message you", "You're in!", "Message sent", "Welcome to UCompass", "Profile saved"])(
    "pops for %s",
    (t) => expect(celebrates(t)).toBe(true),
  );

  it.each(["Not found", "Couldn't send that message", "Upload failed, nothing saved", "Copied the link"])("stays quiet for %s", (t) =>
    expect(celebrates(t)).toBe(false),
  );
});

describe("pops", () => {
  it("picks a pop from the list", () => {
    expect(randomPop(() => 0)).toBe(POPS[0]);
    expect(randomPop(() => 0.999)).toBe(POPS[POPS.length - 1]);
  });

  it("greets each tab with its sticker", () => {
    expect(TAB_POPS.flats.sticker).toBe("roo");
    expect(TAB_POPS.market.sticker).toBe("pie");
    expect(TAB_POPS.meetups.sticker).toBe("sun");
  });
});
