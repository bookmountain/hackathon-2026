using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.EntityFrameworkCore;
using NetTopologySuite;
using NetTopologySuite.Geometries;
using UniMap.Api.Domain;

namespace UniMap.Api.Data;

/// <summary>
/// Fills an empty database with realistic demo data from Data/Seed/*.json:
/// 48 fictional students (real degrees, CC0 avatars in R2) and 20 room listings on real Adelaide
/// streets (openly licensed photos in R2). Runs only in Development (or when Seed:Enabled=true).
/// Every seeded user's password is "password123".
/// </summary>
public static class DevSeeder
{
    public const string Password = "password123";

    private static readonly JsonSerializerOptions Json = new(JsonSerializerDefaults.Web)
    {
        Converters = { new JsonStringEnumConverter() },
    };

    private static readonly GeometryFactory Geo = NtsGeometryServices.Instance.CreateGeometryFactory(srid: 4326);

    private record SeedStudent(
        string Id, string Email, string DisplayName, University University, string Degree, Gender Gender,
        string? Pronouns, int? YearOfStudy, string? Bio, List<string> Habits, List<string> Interests, string? AvatarKey);

    private record SeedFlat(
        string Id, string Owner, string Title, string Suburb, string? Street, double Lat, double Lng,
        int RentPerWeek, int BillsPerWeek, int Bedrooms, int Flatmates, ToiletType Toilet, BathroomType Bathroom,
        Furnishing Furnished, int? MinStayMonths, int AvailableInDays, List<string> Features, List<string> HouseRhythm,
        string? PreferredFlatmate, string? Description, List<string> Housemates);

    /// <param name="Empty">An unfurnished room, used for listings that aren't fully furnished.</param>
    private record SeedPhoto(string Key, string Category, bool Empty);

    public static async Task SeedAsync(AppDbContext db, ILogger logger)
    {
        var students = Read<List<SeedStudent>>("students.json") ?? [];
        await SeedStudentsAsync(db, logger, students);
        await SeedFlatsAsync(db, logger, students);
    }

    private static async Task SeedStudentsAsync(AppDbContext db, ILogger logger, List<SeedStudent> students)
    {
        if (await db.Users.AnyAsync()) return;

        var degrees = await db.Degrees.AsNoTracking().ToListAsync();
        var hash = BCrypt.Net.BCrypt.HashPassword(Password); // bcrypt is slow; hash once and reuse

        foreach (var s in students)
        {
            var degree = degrees.FirstOrDefault(d => d.University == s.University && d.Name == s.Degree);
            if (degree is null) logger.LogWarning("Seed student {Id}: degree '{Degree}' not found", s.Id, s.Degree);

            db.Users.Add(new User
            {
                Email = s.Email,
                PasswordHash = hash,
                University = s.University,
                EmailVerified = true,
                Profile = new Profile
                {
                    DisplayName = s.DisplayName,
                    DegreeId = degree?.Id,
                    Department = degree?.College ?? "Other",
                    Gender = s.Gender,
                    Pronouns = s.Pronouns,
                    YearOfStudy = s.YearOfStudy,
                    Bio = s.Bio,
                    Habits = s.Habits,
                    Interests = s.Interests,
                    AvatarKey = s.AvatarKey,
                },
            });
        }

        await db.SaveChangesAsync();
        logger.LogWarning("Seeded {Count} dev students (password: {Password}), e.g. {Email}",
            students.Count, Password, students.FirstOrDefault()?.Email);
    }

    private static async Task SeedFlatsAsync(AppDbContext db, ILogger logger, List<SeedStudent> students)
    {
        var flats = Read<List<SeedFlat>>("flats.json") ?? [];
        var emailById = students.ToDictionary(s => s.Id, s => s.Email);
        var userIdByEmail = await db.Users.ToDictionaryAsync(u => u.Email, u => u.Id);

        // Photo pool (uploaded to R2 separately). Missing file = listings without photos.
        var photos = (Read<List<SeedPhoto>>("flat-photos.json") ?? [])
            .GroupBy(p => (p.Category, p.Empty))
            .ToDictionary(g => g.Key, g => g.Select(p => p.Key).OrderBy(k => k).ToList());
        if (photos.Count == 0) logger.LogWarning("No flat-photos.json; seeded listings will have no photos");

        if (await db.FlatListings.AnyAsync())
        {
            await BackfillPhotosAsync(db, logger, flats, photos, emailById, userIdByEmail);
            return;
        }

        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var added = 0;
        for (var i = 0; i < flats.Count; i++)
        {
            var f = flats[i];
            if (!emailById.TryGetValue(f.Owner, out var email) || !userIdByEmail.TryGetValue(email, out var ownerId))
            {
                logger.LogWarning("Seed flat {Id}: owner {Owner} not found (reset the database to reseed students)", f.Id, f.Owner);
                continue;
            }

            db.FlatListings.Add(new FlatListing
            {
                OwnerId = ownerId,
                Title = f.Title,
                Description = f.Description,
                Suburb = f.Suburb,
                Street = f.Street,
                Location = Geo.CreatePoint(new Coordinate(f.Lng, f.Lat)),
                RentPerWeek = f.RentPerWeek,
                BillsPerWeek = f.BillsPerWeek,
                Bedrooms = f.Bedrooms,
                Flatmates = f.Flatmates,
                Toilet = f.Toilet,
                Bathroom = f.Bathroom,
                Furnished = f.Furnished,
                MinStayMonths = f.MinStayMonths,
                AvailableFrom = f.AvailableInDays > 0 ? today.AddDays(f.AvailableInDays) : null,
                Features = f.Features,
                HouseRhythm = f.HouseRhythm,
                PreferredFlatmate = f.PreferredFlatmate,
                Housemates = f.Housemates,
                PhotoKeys = PickPhotos(photos, flats, i),
                // Stagger so "newest" ordering looks natural.
                CreatedAt = DateTimeOffset.UtcNow.AddHours(-7 * i),
                UpdatedAt = DateTimeOffset.UtcNow.AddHours(-7 * i),
            });
            added++;
        }

        await db.SaveChangesAsync();
        logger.LogWarning("Seeded {Count} dev flat listings", added);
    }

    /// <summary>
    /// Seeded listings created before the photos existed get them on the next startup,
    /// so nobody has to wipe their database.
    /// </summary>
    private static async Task BackfillPhotosAsync(
        AppDbContext db, ILogger logger, List<SeedFlat> flats, Dictionary<(string, bool), List<string>> photos,
        Dictionary<string, string> emailById, Dictionary<string, Guid> userIdByEmail)
    {
        if (photos.Count == 0) return;
        var filled = 0;
        for (var i = 0; i < flats.Count; i++)
        {
            var f = flats[i];
            if (!emailById.TryGetValue(f.Owner, out var email) || !userIdByEmail.TryGetValue(email, out var ownerId)) continue;
            var listing = await db.FlatListings.FirstOrDefaultAsync(x => x.OwnerId == ownerId && x.Title == f.Title);
            if (listing is null || listing.PhotoKeys.Count > 0) continue;
            listing.PhotoKeys = PickPhotos(photos, flats, i);
            filled++;
        }
        if (filled == 0) return;
        await db.SaveChangesAsync();
        logger.LogWarning("Added photos to {Count} seeded flat listings", filled);
    }

    /// <summary>
    /// A bedroom cover that matches the furnishing (furnished photo for fully furnished rooms, empty
    /// room otherwise), then 2–4 other rooms. Covers are unique while the pool lasts, and the choice is
    /// deterministic, so every teammate's database shows the same photos on the same listing.
    /// </summary>
    private static List<string> PickPhotos(Dictionary<(string, bool), List<string>> pool, List<SeedFlat> flats, int i)
    {
        var empty = flats[i].Furnished != Furnishing.Fully;
        // Position among listings that draw from the same (furnished/empty) bedroom pool.
        var coverIndex = flats.Take(i).Count(f => (f.Furnished != Furnishing.Fully) == empty);

        string? Take(string category, bool wantEmpty, int n) =>
            pool.TryGetValue((category, wantEmpty), out var keys) && keys.Count > 0 ? keys[n % keys.Count]
            : pool.TryGetValue((category, !wantEmpty), out var other) && other.Count > 0 ? other[n % other.Count]
            : null;

        var extras = new[] { "living", "kitchen", "bathroom", "exterior" }
            .Take(2 + i % 3) // 2, 3 or 4 extra photos
            .Select((category, j) => Take(category, category == "living" && flats[i].Furnished == Furnishing.Unfurnished, i * 3 + j));

        return new[] { Take("bedroom", empty, coverIndex) }.Concat(extras)
            .OfType<string>().Distinct().Take(FlatCatalog.MaxPhotos).ToList();
    }

    private static T? Read<T>(string file)
    {
        var path = Path.Combine(AppContext.BaseDirectory, "Data", "Seed", file);
        return File.Exists(path) ? JsonSerializer.Deserialize<T>(File.ReadAllText(path), Json) : default;
    }
}
