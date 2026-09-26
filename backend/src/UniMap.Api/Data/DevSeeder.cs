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

    /// <param name="UserId">Fixed user id; the avatar lives in R2 under avatars/{UserId}/, like real users.</param>
    private record SeedStudent(
        string Id, Guid UserId, string Email, string DisplayName, University University, string Degree, Gender Gender,
        string? Pronouns, int? YearOfStudy, string? Bio, List<string> Habits, List<string> Interests, string? AvatarKey);

    /// <param name="Id">Fixed listing id; its photos live in R2 under flats/{Id}/, like real listings.</param>
    private record SeedFlat(
        Guid Id, string Owner, string Title, string Suburb, string? Street, double Lat, double Lng,
        int RentPerWeek, int BillsPerWeek, int Bedrooms, int Flatmates, ToiletType Toilet, BathroomType Bathroom,
        Furnishing Furnished, int? MinStayMonths, int AvailableInDays, List<string> Features, List<string> HouseRhythm,
        string? PreferredFlatmate, string? Description, List<string> Housemates, List<string> Photos);


    public static async Task SeedAsync(AppDbContext db, ILogger logger)
    {
        var students = Read<List<SeedStudent>>("students.json") ?? [];
        await SeedStudentsAsync(db, logger, students);
        await SeedFlatsAsync(db, logger, students);
    }

    private static async Task SeedStudentsAsync(AppDbContext db, ILogger logger, List<SeedStudent> students)
    {
        if (await db.Users.AnyAsync())
        {
            await SyncAvatarsAsync(db, logger, students);
            return;
        }

        var degrees = await db.Degrees.AsNoTracking().ToListAsync();
        var hash = BCrypt.Net.BCrypt.HashPassword(Password); // bcrypt is slow; hash once and reuse

        foreach (var s in students)
        {
            var degree = degrees.FirstOrDefault(d => d.University == s.University && d.Name == s.Degree);
            if (degree is null) logger.LogWarning("Seed student {Id}: degree '{Degree}' not found", s.Id, s.Degree);

            db.Users.Add(new User
            {
                Id = s.UserId,
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

    /// <summary>
    /// Points already-seeded students at their avatars/{userId}/ key, so images keep loading. Databases
    /// seeded before user ids were fixed can't change ids in place (other tables reference users.id), so
    /// they also get a warning to reseed.
    /// </summary>
    private static async Task SyncAvatarsAsync(AppDbContext db, ILogger logger, List<SeedStudent> students)
    {
        var byEmail = students.ToDictionary(s => s.Email);
        var users = await db.Users.Include(u => u.Profile)
            .Where(u => byEmail.Keys.Contains(u.Email)).ToListAsync();

        var stale = users.Count(u => u.Id != byEmail[u.Email].UserId);
        if (stale > 0)
            logger.LogWarning("{Count} seeded students predate fixed user ids. Reseed so their ids match their " +
                "avatars/{{userId}}/ folders: docker compose down -v && docker compose up -d", stale);

        var updated = 0;
        foreach (var u in users)
        {
            var key = byEmail[u.Email].AvatarKey;
            if (u.Profile is null || u.Profile.AvatarKey == key) continue;
            if (u.Profile.AvatarKey is { } current && !current.StartsWith("seed/")) continue; // user's own upload
            u.Profile.AvatarKey = key;
            updated++;
        }
        if (updated == 0) return;
        await db.SaveChangesAsync();
        logger.LogWarning("Updated avatars on {Count} seeded students", updated);
    }

    private static async Task SeedFlatsAsync(AppDbContext db, ILogger logger, List<SeedStudent> students)
    {
        var flats = Read<List<SeedFlat>>("flats.json") ?? [];
        var emailById = students.ToDictionary(s => s.Id, s => s.Email);
        var userIdByEmail = await db.Users.ToDictionaryAsync(u => u.Email, u => u.Id);


        if (await db.FlatListings.AnyAsync())
        {
            await SyncPhotosAsync(db, logger, flats, emailById, userIdByEmail);
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
                Id = f.Id,
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
                // Already in R2, one folder per listing: flats/{id}/01-bedroom.jpg, ...
                PhotoKeys = f.Photos,
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
    /// Keeps already-seeded listings in step with flats.json (fixed ids, photos in flats/{id}/), so
    /// nobody has to wipe their database. Listings are matched by id, or by owner + title for ones
    /// seeded before ids were fixed. Photos a user uploaded themselves are never touched.
    /// </summary>
    private static async Task SyncPhotosAsync(
        AppDbContext db, ILogger logger, List<SeedFlat> flats,
        Dictionary<string, string> emailById, Dictionary<string, Guid> userIdByEmail)
    {
        var updated = 0;
        foreach (var f in flats)
        {
            if (!emailById.TryGetValue(f.Owner, out var email) || !userIdByEmail.TryGetValue(email, out var ownerId)) continue;
            var listing = await db.FlatListings.FirstOrDefaultAsync(x => x.Id == f.Id)
                ?? await db.FlatListings.FirstOrDefaultAsync(x => x.OwnerId == ownerId && x.Title == f.Title);
            if (listing is null) continue;

            var changed = false;
            if (listing.Id != f.Id)
            {
                // Primary keys can't change through EF tracking; nothing references flat_listings.
                await db.Database.ExecuteSqlAsync($"UPDATE flat_listings SET id = {f.Id} WHERE id = {listing.Id}");
                db.Entry(listing).State = EntityState.Detached;
                listing = await db.FlatListings.FirstAsync(x => x.Id == f.Id);
                changed = true;
            }

            var ownPhotos = listing.PhotoKeys.Any(k => !k.StartsWith("seed/") && !f.Photos.Contains(k));
            if (!ownPhotos && !listing.PhotoKeys.SequenceEqual(f.Photos))
            {
                listing.PhotoKeys = f.Photos;
                changed = true;
            }
            if (changed) updated++;
        }
        if (updated == 0) return;
        await db.SaveChangesAsync();
        logger.LogWarning("Synced ids/photos on {Count} seeded flat listings", updated);
    }

    private static T? Read<T>(string file)
    {
        var path = Path.Combine(AppContext.BaseDirectory, "Data", "Seed", file);
        return File.Exists(path) ? JsonSerializer.Deserialize<T>(File.ReadAllText(path), Json) : default;
    }
}
