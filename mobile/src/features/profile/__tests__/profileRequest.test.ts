import type { Profile } from "@/api/types";
import { ME } from "@/test/fixtures";
import { presetOf, profileRequest } from "../profileRequest";

const profile = ME.profile as Profile;

describe("profileRequest", () => {
  it("changes only what was edited and sends the photo's key back", () => {
    expect(profileRequest(profile, { displayName: "Kai" })).toEqual({
      displayName: "Kai",
      degreeId: 21,
      gender: "Male",
      pronouns: "he/him",
      yearOfStudy: 2,
      bio: "Second-year CS.",
      habits: ["night-owl", "coffee"],
      interests: ["coding"],
      avatarKey: `avatars/${ME.userId}/avatar.png`,
      avatarPreset: 3,
    });
  });

  it("sets or clears the preset colour", () => {
    expect(profileRequest(profile, { avatarPreset: 5 }).avatarPreset).toBe(5);
    expect(profileRequest(profile, { avatarPreset: null }).avatarPreset).toBeNull();
    expect(presetOf(-1)).toBeNull();
    expect(presetOf(0)).toBe(0);
  });

  it("fills what the API requires for a new profile", () => {
    expect(profileRequest(null, { displayName: "CompassRookie", degreeId: 96, avatarPreset: presetOf(2) })).toEqual({
      displayName: "CompassRookie",
      degreeId: 96,
      gender: "PreferNotToSay",
      pronouns: null,
      yearOfStudy: null,
      bio: null,
      habits: [],
      interests: [],
      avatarKey: null,
      avatarPreset: 2,
    });
  });
});
