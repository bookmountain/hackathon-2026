import { GOALS, INTERESTS, type GoalKey, type Interest, type StudyLevel } from "./constants";

export type Persona = { goals: GoalKey[]; interests: Interest[]; level: StudyLevel | null };

export const EMPTY_PERSONA: Persona = { goals: [], interests: [], level: null };

/** The API keeps interests as lower-case hyphenated tags ("study-groups") */
export function interestTag(interest: Interest): string {
  return interest.toLowerCase().replace(/\s+/g, "-");
}

/** Back from the API's tags to the design's labels; unknown tags are dropped */
export function interestsFromTags(tags: string[]): Interest[] {
  return INTERESTS.filter((i) => tags.includes(interestTag(i)));
}

/** What's still needed before "Enter UCompass" works, or null when complete */
export function missingHint(p: Persona): string | null {
  const missing = [
    p.goals.length === 0 && "a goal",
    p.interests.length === 0 && "an interest",
    !p.level && "your study level",
  ].filter(Boolean) as string[];
  if (missing.length === 0) return null;
  const list = missing.length === 1 ? missing[0] : `${missing.slice(0, -1).join(", ")} and ${missing[missing.length - 1]}`;
  return `Pick ${list} to continue`;
}

export function isPersonalised(p: Persona): boolean {
  return p.goals.length > 0 || p.interests.length > 0;
}

export function goalTitle(key: GoalKey): string {
  return GOALS.find((g) => g.key === key)?.title ?? key;
}

export function toggle<T>(list: readonly T[], value: T): T[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

/** The API keeps at most 20 interests */
const MAX_INTERESTS = 20;

/** The profile's interest tags after a persona save: the picked interests, then any tags the app doesn't offer */
export function profileInterestTags(current: string[], interests: Interest[]): string[] {
  const offered = INTERESTS.map(interestTag);
  return [...interests.map(interestTag), ...current.filter((t) => !offered.includes(t))].slice(0, MAX_INTERESTS);
}
