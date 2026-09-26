import type { Profile } from "@/api/types";
import { ME } from "@/test/fixtures";
import { avatarKeyOf, profileRequest } from "../profileRequest";

const profile = ME.profile as Profile;

describe("avatarKeyOf", () => {
  it("recovers the R2 key from a path-style presigned URL", () => {
    expect(avatarKeyOf(profile)).toBe(`avatars/${ME.userId}/avatar.png`);
  });

  it("works for a custom domain, and refuses someone else's key", () => {
    expect(avatarKeyOf({ ...profile, avatarUrl: `https://cdn.example/avatars/${ME.userId}/a.png?sig` })).toBe(
      `avatars/${ME.userId}/a.png`,
    );
    expect(avatarKeyOf({ ...profile, avatarUrl: "https://cdn.example/avatars/someone-else/a.png" })).toBeNull();
    expect(avatarKeyOf({ ...profile, avatarUrl: null })).toBeNull();
  });
});

describe("profileRequest", () => {
  it("changes only what was edited and keeps the avatar", () => {
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
    });
  });

  it("fills what the API requires for a new profile", () => {
    expect(profileRequest(null, { displayName: "CompassRookie", degreeId: 96 })).toEqual({
      displayName: "CompassRookie",
      degreeId: 96,
      gender: "PreferNotToSay",
      pronouns: null,
      yearOfStudy: null,
      bio: null,
      habits: [],
      interests: [],
      avatarKey: null,
    });
  });
});
