import { INTERESTS } from "../constants";
import { EMPTY_PERSONA, interestsFromTags, interestTag, isPersonalised, missingHint, profileInterestTags, toggle } from "../logic";

describe("persona", () => {
  it("round-trips interests through the API's tags", () => {
    expect(interestTag("Study groups")).toBe("study-groups");
    expect(interestsFromTags(["study-groups", "coffee", "knitting"])).toEqual(["Coffee", "Study groups"]);
  });

  it("keeps profile tags the app doesn't offer", () => {
    expect(profileInterestTags(["coding", "gym", "coffee"], ["Coffee", "Study groups"])).toEqual([
      "coffee",
      "study-groups",
      "coding",
    ]);
  });

  it("keeps within the API's 20 interests, picked ones first", () => {
    const extras = Array.from({ length: 10 }, (_, i) => `extra-${i}`);
    const tags = profileInterestTags(extras, [...INTERESTS]);
    expect(tags).toHaveLength(20);
    expect(tags.slice(0, 16)).toEqual(INTERESTS.map(interestTag));
  });

  it("names what's missing", () => {
    expect(missingHint(EMPTY_PERSONA)).toBe("Pick a goal, an interest and your study level to continue");
    expect(missingHint({ goals: ["study"], interests: [], level: "PhD" })).toBe("Pick an interest to continue");
    expect(missingHint({ goals: ["study"], interests: ["Gym"], level: null })).toBe("Pick your study level to continue");
    expect(missingHint({ goals: ["study"], interests: ["Gym"], level: "PhD" })).toBeNull();
  });

  it("knows when you've personalised", () => {
    expect(isPersonalised(EMPTY_PERSONA)).toBe(false);
    expect(isPersonalised({ ...EMPTY_PERSONA, interests: ["Art"] })).toBe(true);
  });

  it("toggles list values", () => {
    expect(toggle(["a", "b"], "a")).toEqual(["b"]);
    expect(toggle(["a"], "b")).toEqual(["a", "b"]);
  });
});
