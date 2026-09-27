// Host form "Who's it for?" (Study events only). The API has no field for it yet, so
// the levels only live on the phone that published the event.

export const EVERYONE = "Everyone";

export const STUDY_LEVELS = [EVERYONE, "Undergrad", "Postgrad", "PhD", "Alumni"];

/** Everyone is exclusive, the others combine; clearing the last one goes back to Everyone */
export function toggleLevel(levels: string[], level: string): string[] {
  if (level === EVERYONE) return [EVERYONE];
  const others = levels.filter((l) => l !== EVERYONE);
  const next = others.includes(level) ? others.filter((l) => l !== level) : [...others, level];
  return next.length ? next : [EVERYONE];
}
