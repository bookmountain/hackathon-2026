namespace UniMap.Api.Domain;

/// <summary>Suggested tags for the onboarding UI. Users may still send custom tags.</summary>
public static class Catalog
{
    public static readonly string[] Habits =
    [
        "early-bird", "night-owl", "gym", "running", "non-smoker", "smoker", "drinks-socially",
        "no-alcohol", "vegetarian", "vegan", "cooks-at-home", "eats-out", "tidy", "relaxed-about-mess",
        "studies-in-library", "studies-at-home", "quiet", "social", "gamer", "coffee", "tea",
    ];

    public static readonly string[] Interests =
    [
        "football", "basketball", "badminton", "hiking", "beach", "photography", "music", "live-gigs",
        "anime", "movies", "reading", "board-games", "coding", "hackathons", "travel", "food",
        "language-exchange", "volunteering", "art", "dance",
    ];

    public static List<string> Normalize(IEnumerable<string>? tags) =>
        (tags ?? [])
            .Select(t => t.Trim().ToLowerInvariant().Replace(' ', '-'))
            .Where(t => t.Length is > 0 and <= 40)
            .Distinct()
            .ToList();
}
