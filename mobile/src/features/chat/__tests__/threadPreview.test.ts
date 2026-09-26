import { threadPreview } from "../threadPreview";

describe("threadPreview", () => {
  it("shows the last real message, prefixed when it's mine", () => {
    expect(
      threadPreview([
        { from: "system", text: "About: Sunny room" },
        { from: "them", text: "Hi!" },
        { from: "me", text: "Can I inspect?" },
      ]),
    ).toBe("You: Can I inspect?");
  });

  it("ignores context banners and prompts a hello when empty", () => {
    expect(threadPreview([{ from: "system", text: "About: Sunny room" }])).toBe("Say hi");
  });
});
