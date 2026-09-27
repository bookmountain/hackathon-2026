import type { AvatarStyle, Profile, ProfileRequest } from "@/api/types";

type Change = {
  displayName?: string;
  degreeId?: number;
  interests?: string[];
  avatarPreset?: number | null;
  avatarStyle?: AvatarStyle | null;
};

/**
 * A full PUT /api/me/profile body: the change on top of everything already saved,
 * so fields the app doesn't show (bio, habits, pronouns, the photo avatar…) survive an edit.
 */
export function profileRequest(current: Profile | null, change: Change): ProfileRequest {
  return {
    displayName: change.displayName ?? current?.displayName ?? "",
    degreeId: change.degreeId ?? current?.degree?.id ?? null,
    // The design doesn't ask; the API needs a value (see FRONTEND-GAPS.md)
    gender: current?.gender ?? "PreferNotToSay",
    pronouns: current?.pronouns ?? null,
    yearOfStudy: current?.yearOfStudy ?? null,
    bio: current?.bio ?? null,
    habits: current?.habits ?? [],
    interests: change.interests ?? current?.interests ?? [],
    // The API replaces the photo with whatever key is sent
    avatarKey: current?.avatarKey ?? null,
    avatarPreset: "avatarPreset" in change ? (change.avatarPreset ?? null) : (current?.avatarPreset ?? null),
    avatarStyle: "avatarStyle" in change ? (change.avatarStyle ?? null) : (current?.avatarStyle ?? null),
  };
}

/** AVATAR_COLORS index (-1 = none) as the API's preset (null = none) */
export function presetOf(index: number): number | null {
  return index >= 0 ? index : null;
}
