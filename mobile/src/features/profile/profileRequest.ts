import type { Profile, ProfileRequest } from "@/api/types";

/**
 * The R2 key of the current avatar, recovered from its presigned URL
 * (".../{bucket}/avatars/{userId}/avatar.png?X-Amz-…"). PUT /api/me/profile
 * replaces the avatar with whatever key is sent, and GET /api/me doesn't return
 * the key, so without this every profile edit would remove the photo.
 */
export function avatarKeyOf(profile: Profile): string | null {
  if (!profile.avatarUrl) return null;
  const prefix = `avatars/${profile.userId}/`;
  const path = decodeURIComponent(profile.avatarUrl.replace(/^https?:\/\/[^/]+\//, "").split("?")[0]);
  // Path-style URLs start with the bucket name; a custom domain wouldn't
  const withoutBucket = path.slice(path.indexOf("/") + 1);
  return [path, withoutBucket].find((k) => k.startsWith(prefix)) ?? null;
}

/**
 * A full PUT /api/me/profile body: the change on top of everything already saved,
 * so fields the app doesn't show (bio, habits, pronouns…) survive an edit.
 */
export function profileRequest(
  current: Profile | null,
  change: { displayName?: string; degreeId?: number },
): ProfileRequest {
  return {
    displayName: change.displayName ?? current?.displayName ?? "",
    degreeId: change.degreeId ?? current?.degree?.id ?? null,
    // The design doesn't ask; the API needs a value (see FRONTEND-GAPS.md)
    gender: current?.gender ?? "PreferNotToSay",
    pronouns: current?.pronouns ?? null,
    yearOfStudy: current?.yearOfStudy ?? null,
    bio: current?.bio ?? null,
    habits: current?.habits ?? [],
    interests: current?.interests ?? [],
    avatarKey: current ? avatarKeyOf(current) : null,
  };
}
