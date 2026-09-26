import { problemMessage } from "../client";

describe("problemMessage", () => {
  it("prefers validation messages, then detail, then title", () => {
    expect(problemMessage({ title: "Bad", errors: { Price: ["Too high"], Title: ["Required"] } }, 400)).toBe("Too high\nRequired");
    expect(problemMessage({ title: "Conflict", detail: "This event is full." }, 409)).toBe("This event is full.");
    expect(problemMessage({ title: "Not Found" }, 404)).toBe("Not Found");
  });

  it("has a fallback for empty bodies", () => {
    expect(problemMessage(undefined, 502)).toBe("Something went wrong on our side. Try again.");
    expect(problemMessage(undefined, 404)).toBe("Request failed (404)");
  });
});
