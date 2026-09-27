// "Make it yours" options from the design (isPersona screen)

export const GOALS = [
  { key: "study", emoji: "📚", title: "Study buddies", line: "Find people in your course or units" },
  { key: "flat", emoji: "🏠", title: "Flatmates", line: "A room or people to share with" },
  { key: "market", emoji: "🛍️", title: "Buy & sell", line: "Second-hand gear near campus" },
  { key: "friends", emoji: "👋", title: "Meet people", line: "Casual hangs and walk-in events" },
  { key: "explore", emoji: "🧭", title: "Just exploring", line: "See what's around Adelaide" },
] as const;

export type GoalKey = (typeof GOALS)[number]["key"];

export const INTERESTS = [
  "Coffee",
  "Gym",
  "Gaming",
  "Music",
  "Cooking",
  "Hiking",
  "Anime",
  "Football",
  "Study groups",
  "Photography",
  "Startups",
  "Volunteering",
  "Languages",
  "Art",
  "Movies",
  "Dancing",
] as const;

export type Interest = (typeof INTERESTS)[number];

export const STUDY_LEVELS = ["Undergrad", "Postgrad", "PhD", "Alumni"] as const;

export type StudyLevel = (typeof STUDY_LEVELS)[number];
