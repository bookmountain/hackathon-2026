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
        await SeedConsentsAsync(db, logger, students);
        await SeedFlatsAsync(db, logger, students);
        await SeedChatsAsync(db, logger, students);
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

    /// <summary>
    /// Seeded students have already been through the consent screen, so demo logins go straight into
    /// the app. Also covers databases seeded before consents existed, and new policy versions.
    /// </summary>
    private static async Task SeedConsentsAsync(AppDbContext db, ILogger logger, List<SeedStudent> students)
    {
        var emails = students.Select(s => s.Email).ToList();
        var missing = await db.Users
            .Where(u => emails.Contains(u.Email))
            .Where(u => !db.ConsentRecords.Any(c => c.UserId == u.Id && c.PolicyVersion == ConsentPolicy.Version))
            .Select(u => u.Id)
            .ToListAsync();
        if (missing.Count == 0) return;

        var at = DateTimeOffset.UtcNow;
        foreach (var (userId, i) in missing.Select((id, i) => (id, i)))
            foreach (var c in ConsentPolicy.All)
                db.ConsentRecords.Add(new ConsentRecord
                {
                    UserId = userId, Type = c.Type, PolicyVersion = ConsentPolicy.Version, CreatedAt = at,
                    Granted = c.Required || i % 2 == 0, // about half opt in to usage stats
                });
        await db.SaveChangesAsync();
        logger.LogWarning("Recorded consents for {Count} seeded students", missing.Count);
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

    /// <summary>
    /// A few chats for Koala_Kai (the Swagger login) so the Messages screen isn't empty in the demo:
    /// one per chat type, with unread replies. Replies are from the UCompass prototype.
    /// </summary>
    private static async Task SeedChatsAsync(AppDbContext db, ILogger logger, List<SeedStudent> students)
    {
        if (await db.Conversations.AnyAsync()) return;

        var emailById = students.ToDictionary(s => s.Id, s => s.Email);
        var users = await db.Users.ToDictionaryAsync(u => u.Email, u => u.Id);
        Guid? U(string id) => emailById.TryGetValue(id, out var e) && users.TryGetValue(e, out var u) ? u : null;
        var flats = (Read<List<SeedFlat>>("flats.json") ?? []).ToDictionary(f => f.Id);
        var flatIds = await db.FlatListings.Select(f => f.Id).ToListAsync();

        var now = DateTimeOffset.UtcNow;
        var added = 0;

        // (me, other, about flat, [(fromMe, text, minutesAgo)], meReadAll)
        var scripts = new (string Me, string Other, Guid? Flat, (bool FromMe, string Text, int Ago)[] Lines, bool ReadAll)[]
        {
            ("p01", "p07", flats.Values.FirstOrDefault(f => f.Owner == "p07")?.Id,
                [(true, "Hi! Is the room at Frome St still available?", 95),
                 (false, "Hi! Yes, the room's still free. Want to inspect Thursday arvo?", 12)], false),
            ("p01", "p05", null,
                [(false, "Hey! Saw you're in CS too. Keen to do MATHS 1011 revision at Barr Smith this week?", 40)], false),
        };
        // Also chat with the owner of Mia's Hutt St room, already read.
        var hutt = flats.Values.FirstOrDefault(f => f.Owner == "p02");
        if (hutt is not null)
            scripts = [.. scripts, ("p01", "p02", hutt.Id,
                [(true, "Hi! How are bills split at the Hutt St place?", 60 * 26),
                 (false, "Bills are split evenly — electricity, gas and Wi-Fi.", 60 * 25),
                 (true, "Perfect, thanks! I'll let you know after I inspect.", 60 * 24)], true)];

        foreach (var (meId, otherId, flatId, lines, readAll) in scripts)
        {
            if (U(meId) is not { } me || U(otherId) is not { } other) continue;
            var (a, b) = Conversation.Order(me, other);
            var conv = new Conversation { UserAId = a, UserBId = b, CreatedAt = now.AddMinutes(-lines[0].Ago - 1) };
            db.Conversations.Add(conv);

            if (flatId is { } fid && flatIds.Contains(fid) && flats.TryGetValue(fid, out var f))
                db.ChatMessages.Add(new ChatMessage
                {
                    ConversationId = conv.Id, Kind = ChatMessageKind.About, AboutType = ChatAboutType.Flat, AboutId = fid,
                    Body = $"About: {f.Title} · ${f.RentPerWeek}/wk", CreatedAt = now.AddMinutes(-lines[0].Ago - 1),
                });

            foreach (var (fromMe, text, ago) in lines)
            {
                var at = now.AddMinutes(-ago);
                db.ChatMessages.Add(new ChatMessage
                {
                    ConversationId = conv.Id, SenderId = fromMe ? me : other, Kind = ChatMessageKind.Text, Body = text, CreatedAt = at,
                });
                conv.LastMessageAt = at;
                if (fromMe) conv.MarkRead(me, at);
                else conv.MarkRead(other, at);
            }
            if (readAll) conv.MarkRead(me, conv.LastMessageAt);
            added++;
        }

        await db.SaveChangesAsync();
        logger.LogWarning("Seeded {Count} demo chats for a1900000@adelaide.edu.au (Koala_Kai)", added);
    }

    private static T? Read<T>(string file)
    {
        var path = Path.Combine(AppContext.BaseDirectory, "Data", "Seed", file);
        return File.Exists(path) ? JsonSerializer.Deserialize<T>(File.ReadAllText(path), Json) : default;
    }
}
