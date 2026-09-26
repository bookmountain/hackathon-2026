using Microsoft.EntityFrameworkCore;
using UniMap.Api.Domain;

namespace UniMap.Api.Data;

/// <summary>
/// Fills an empty database with fake students so matching has something to work with.
/// Runs only in Development (or when Seed:Enabled=true). Every seeded user's password is "password123".
/// </summary>
public static class DevSeeder
{
    public const string Password = "password123";

    private static readonly string[] FirstNames =
    [
        "Olivia", "Liam", "Mia", "Noah", "Ava", "Jack", "Chloe", "William", "Zoe", "Lucas",
        "Isla", "Ethan", "Ruby", "Leo", "Grace", "Oscar", "Wei", "Priya", "Minh", "Aisha",
        "Hiroshi", "Sofia", "Arjun", "Mei", "Tom", "Hannah", "Ali", "Emma", "Kai", "Yuki",
    ];

    public static async Task SeedAsync(AppDbContext db, ILogger logger, int count = 40)
    {
        if (await db.Users.AnyAsync()) return;

        var rng = new Random(42); // deterministic, so everyone on the team gets the same data
        var hash = BCrypt.Net.BCrypt.HashPassword(Password); // bcrypt is slow; hash once and reuse
        var genders = Enum.GetValues<Gender>();

        // Real degrees from the reference table (DegreeSeeder runs first). Mostly undergrads.
        var degrees = await db.Degrees.AsNoTracking().ToListAsync();
        Degree PickDegree(University uni)
        {
            var level = rng.Next(10) < 8 ? DegreeLevel.Undergraduate : DegreeLevel.Postgraduate;
            var pool = degrees.Where(d => d.University == uni && d.Level == level).ToList();
            return pool[rng.Next(pool.Count)];
        }

        for (var i = 0; i < count; i++)
        {
            var gender = genders[rng.Next(genders.Length)];
            var uni = i % 2 == 0 ? University.Adelaide : University.Flinders;
            var degree = PickDegree(uni);
            var email = uni == University.Adelaide
                ? $"a{1_900_000 + i}@adelaide.edu.au"
                : $"seed{i:D3}@flinders.edu.au";

            db.Users.Add(new User
            {
                Email = email,
                PasswordHash = hash,
                University = uni,
                EmailVerified = true,
                Profile = new Profile
                {
                    DisplayName = FirstNames[i % FirstNames.Length],
                    DegreeId = degree.Id,
                    Department = degree.College,
                    Gender = gender,
                    Pronouns = PronounsFor(gender, rng),
                    YearOfStudy = degree.Level == DegreeLevel.Undergraduate ? rng.Next(1, 5) : rng.Next(1, 3),
                    Bio = "Seeded test user.",
                    Habits = Pick(rng, Catalog.Habits, 3, 6),
                    Interests = Pick(rng, Catalog.Interests, 2, 5),
                },
            });
        }

        await db.SaveChangesAsync();
        logger.LogWarning("Seeded {Count} dev users (password: {Password}), e.g. a1900000@adelaide.edu.au", count, Password);
    }

    private static string? PronounsFor(Gender gender, Random rng) => gender switch
    {
        _ when rng.Next(4) == 0 => null, // lots of people leave it blank
        Gender.Female => "she/her",
        Gender.Male => "he/him",
        Gender.NonBinary => "they/them",
        _ => null,
    };

    private static List<string> Pick(Random rng, string[] source, int min, int max) =>
        source.OrderBy(_ => rng.Next()).Take(rng.Next(min, max + 1)).ToList();
}
