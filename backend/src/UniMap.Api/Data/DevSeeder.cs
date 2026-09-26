using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.EntityFrameworkCore;
using NetTopologySuite;
using NetTopologySuite.Geometries;
using UniMap.Api.Domain;
using UniMap.Api.Services;

namespace UniMap.Api.Data;

/// <summary>
/// Fills an empty database with realistic demo data from Data/Seed/*.json:
/// 48 fictional students (real degrees, CC0 avatars in R2), 20 room listings on real Adelaide
/// streets, 21 market items (openly licensed photos in R2) and 16 walk-in meetups at real places. Runs
/// only in Development (or when Seed:Enabled=true).
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

    /// <param name="Id">Fixed item id; its photos live in R2 under items/{Id}/, like real items.</param>
    /// <param name="AvailableInDays">For availability From, so the date never goes stale.</param>
    private record SeedItem(
        Guid Id, string Label, string Seller, string Title, int Price, ItemCategory Category, ItemCondition Condition,
        string? ConditionNote, ItemAvailability Availability, int AvailableInDays, string? PickupPointId, string? PlaceName,
        double? Lat, double? Lng, int PostedHoursAgo, string? Description, List<string> Photos);

    /// <param name="Id">Fixed event id. Events have no photos, so nothing is stored in R2.</param>
    /// <param name="DayOfWeek">The event is on the next such day at Start (Adelaide time), so it's always in the
    /// coming week. Finished ones are moved on a week by <see cref="RollSeedEventsAsync"/>.</param>
    /// <param name="End">Optional end time, e.g. "21:30".</param>
    /// <param name="Going">Headcount, including the host and AlsoGoing. The rest are other seeded students.</param>
    /// <param name="AlsoGoing">Students who must be going, e.g. p01 so Koala_Kai sees "Going ✓" on one event.</param>
    private record SeedEvent(
        Guid Id, string Label, string Host, string Title, EventType Type, DayOfWeek DayOfWeek, string Start, string? End,
        string? PlaceId, string? PlaceName, double? Lat, double? Lng, int Capacity, int Going, List<string> AlsoGoing,
        bool WalkInsWelcome, string? Description);

    public static async Task SeedAsync(AppDbContext db, ILogger logger)
    {
        var students = Read<List<SeedStudent>>("students.json") ?? [];
        await SeedStudentsAsync(db, logger, students);
        await SeedConsentsAsync(db, logger, students);
        await SeedFlatsAsync(db, logger, students);
        await SeedItemsAsync(db, logger, students);
        await SeedEventsAsync(db, logger, students);
        await SeedChatsAsync(db, logger, students);
        await SeedItemChatAsync(db, logger, students);
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

    private static async Task SeedItemsAsync(AppDbContext db, ILogger logger, List<SeedStudent> students)
    {
        var items = Read<List<SeedItem>>("items.json") ?? [];
        if (await db.MarketItems.AnyAsync())
        {
            await SyncItemPhotosAsync(db, logger, items);
            return;
        }

        var emailById = students.ToDictionary(s => s.Id, s => s.Email);
        var userIdByEmail = await db.Users.ToDictionaryAsync(u => u.Email, u => u.Id);
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var added = 0;
        foreach (var i in items)
        {
            if (!emailById.TryGetValue(i.Seller, out var email) || !userIdByEmail.TryGetValue(email, out var sellerId))
            {
                logger.LogWarning("Seed item {Label}: seller {Seller} not found (reset the database to reseed students)", i.Label, i.Seller);
                continue;
            }

            var point = i.PickupPointId is { } pp ? PickupPoints.Find(pp) : null;
            if (i.PickupPointId is not null && point is null)
            {
                logger.LogWarning("Seed item {Label}: unknown pickup point {Point}", i.Label, i.PickupPointId);
                continue;
            }

            var posted = DateTimeOffset.UtcNow.AddHours(-i.PostedHoursAgo);
            db.MarketItems.Add(new MarketItem
            {
                Id = i.Id,
                SellerId = sellerId,
                Title = i.Title,
                Description = i.Description,
                Price = i.Price,
                Category = i.Category,
                Condition = i.Condition,
                ConditionNote = i.ConditionNote,
                Availability = i.Availability,
                AvailableFrom = i.Availability == ItemAvailability.From ? today.AddDays(i.AvailableInDays) : null,
                PickupPointId = point?.Id,
                PlaceName = point is null ? i.PlaceName : null,
                Location = point is not null
                    ? Geo.CreatePoint(new Coordinate(point.Lng, point.Lat))
                    : Geo.CreatePoint(new Coordinate(i.Lng!.Value, i.Lat!.Value)),
                // Already in R2, one folder per item: items/{id}/01.jpg, ...
                PhotoKeys = i.Photos,
                CreatedAt = posted,
                UpdatedAt = posted,
            });
            added++;
        }

        await db.SaveChangesAsync();
        logger.LogWarning("Seeded {Count} dev market items", added);
    }

    /// <summary>
    /// Keeps already-seeded items' photos in step with items.json, so nobody has to wipe their database.
    /// Photos a user uploaded themselves (items/{id}/{guid}.jpg) are never touched.
    /// </summary>
    private static async Task SyncItemPhotosAsync(AppDbContext db, ILogger logger, List<SeedItem> items)
    {
        var byId = items.ToDictionary(i => i.Id);
        var rows = await db.MarketItems.Where(x => byId.Keys.Contains(x.Id)).ToListAsync();
        var updated = 0;
        foreach (var row in rows)
        {
            var photos = byId[row.Id].Photos;
            var ownPhotos = row.PhotoKeys.Any(k => !IsSeedItemPhoto(k, row.Id));
            if (ownPhotos || row.PhotoKeys.SequenceEqual(photos)) continue;
            row.PhotoKeys = photos;
            updated++;
        }
        if (updated == 0) return;
        await db.SaveChangesAsync();
        logger.LogWarning("Synced photos on {Count} seeded market items", updated);
    }

    /// <summary>Seed photos are numbered (items/{id}/01.jpg); uploads are named by a random guid.</summary>
    private static bool IsSeedItemPhoto(string key, Guid itemId) =>
        System.Text.RegularExpressions.Regex.IsMatch(key, $@"^items/{itemId}/\d{{2}}\.jpg$");

    private static async Task SeedEventsAsync(AppDbContext db, ILogger logger, List<SeedStudent> students)
    {
        if (await db.MeetupEvents.AnyAsync())
        {
            await RollSeedEventsAsync(db, logger);
            return;
        }

        var events = Read<List<SeedEvent>>("events.json") ?? [];
        var userIds = await SeedUserIdsAsync(db, students);
        var now = DateTimeOffset.UtcNow;
        var added = 0;
        foreach (var (e, i) in events.Select((e, i) => (e, i)))
        {
            if (!userIds.TryGetValue(e.Host, out var hostId))
            {
                logger.LogWarning("Seed event {Label}: host {Host} not found (reset the database to reseed students)", e.Label, e.Host);
                continue;
            }
            var point = e.PlaceId is { } pid ? PickupPoints.Find(pid) : null;
            if (e.PlaceId is not null && point is null)
            {
                logger.LogWarning("Seed event {Label}: unknown place {Place}", e.Label, e.PlaceId);
                continue;
            }

            var (start, end) = NextOccurrence(e, now);
            var created = now.AddHours(-5 * i - 3); // "hosted" over the last few days
            var ev = new MeetupEvent
            {
                Id = e.Id,
                HostId = hostId,
                Title = e.Title,
                Description = e.Description,
                Type = e.Type,
                StartsAt = start,
                EndsAt = end,
                PlaceId = point?.Id,
                PlaceName = e.PlaceName ?? (point is null ? MeetupCatalog.PinnedLocation : null),
                Location = point is not null
                    ? Geo.CreatePoint(new Coordinate(point.Lng, point.Lat))
                    : Geo.CreatePoint(new Coordinate(e.Lng!.Value, e.Lat!.Value)),
                Capacity = e.Capacity,
                WalkInsWelcome = e.WalkInsWelcome,
                CreatedAt = created,
                UpdatedAt = created,
            };
            ev.Attendees.AddRange(SeedAttendees(e, students, userIds).Select(u => new EventAttendee { UserId = u, JoinedAt = created }));
            db.MeetupEvents.Add(ev);
            added++;
        }

        await db.SaveChangesAsync();
        logger.LogWarning("Seeded {Count} dev meetups", added);
    }

    /// <summary>
    /// Moves seeded events that have finished to their next week, and resets who's going to the seeded
    /// headcount, so the Meetups tab never runs empty in a long-lived demo database. Runs on startup and
    /// hourly (<see cref="Services.DemoEventsRefresher"/>). Events users host themselves are never touched.
    /// </summary>
    public static async Task RollSeedEventsAsync(AppDbContext db, ILogger logger)
    {
        var events = (Read<List<SeedEvent>>("events.json") ?? []).ToDictionary(e => e.Id);
        var students = Read<List<SeedStudent>>("students.json") ?? [];
        var now = DateTimeOffset.UtcNow;
        var rows = await db.MeetupEvents.Where(e => events.Keys.Contains(e.Id)).ToListAsync();
        var finished = rows.Where(e => MeetupCatalog.EndOf(e) <= now).ToList();
        if (finished.Count == 0) return;

        var userIds = await SeedUserIdsAsync(db, students);
        var ids = finished.Select(e => e.Id).ToList();
        await using var tx = await db.Database.BeginTransactionAsync();
        await db.EventAttendees.Where(a => ids.Contains(a.EventId)).ExecuteDeleteAsync();
        foreach (var row in finished)
        {
            var seed = events[row.Id];
            (row.StartsAt, row.EndsAt) = NextOccurrence(seed, now);
            row.UpdatedAt = now;
            db.EventAttendees.AddRange(SeedAttendees(seed, students, userIds)
                .Select(u => new EventAttendee { EventId = row.Id, UserId = u, JoinedAt = now }));
        }
        await db.SaveChangesAsync();
        await tx.CommitAsync();
        logger.LogWarning("Moved {Count} finished seeded meetups to next week", finished.Count);
    }

    /// <summary>The first time on the event's weekday (Adelaide time) that hasn't finished yet.</summary>
    private static (DateTimeOffset Start, DateTimeOffset? End) NextOccurrence(SeedEvent e, DateTimeOffset now)
    {
        var startTime = TimeOnly.Parse(e.Start);
        TimeOnly? endTime = e.End is { } t ? TimeOnly.Parse(t) : null;
        for (var day = AdelaideTime.Today(); ; day = day.AddDays(1))
        {
            if (day.DayOfWeek != e.DayOfWeek) continue;
            var start = AdelaideTime.ToUtc(day, startTime);
            DateTimeOffset? end = endTime is { } et ? AdelaideTime.ToUtc(day, et) : null;
            if ((end ?? start + MeetupCatalog.DefaultLength) > now) return (start, end);
        }
    }

    /// <summary>
    /// The host, AlsoGoing, then other students in a fixed pseudo-random order until the headcount is reached.
    /// Koala_Kai (p01, the demo login) is only included through AlsoGoing, so the demo can tap Join.
    /// </summary>
    private static List<Guid> SeedAttendees(SeedEvent e, List<SeedStudent> students, Dictionary<string, Guid> userIds)
    {
        var picked = new List<string> { e.Host };
        picked.AddRange(e.AlsoGoing.Where(id => id != e.Host));
        picked.AddRange(students.Select(s => s.Id)
            .Where(id => id != "p01" && !picked.Contains(id))
            .OrderBy(id => StableHash($"{e.Label}/{id}"))
            .Take(Math.Max(0, e.Going - picked.Count)));
        return picked.Where(userIds.ContainsKey).Select(id => userIds[id]).ToList();
    }

    /// <summary>FNV-1a, so the same students go to the same events on every machine.</summary>
    private static uint StableHash(string s)
    {
        var h = 2166136261;
        foreach (var c in s) h = (h ^ c) * 16777619;
        return h;
    }

    /// <summary>Seed student id (p01…) → user id, for students that exist in this database.</summary>
    private static async Task<Dictionary<string, Guid>> SeedUserIdsAsync(AppDbContext db, List<SeedStudent> students)
    {
        var byEmail = await db.Users.ToDictionaryAsync(u => u.Email, u => u.Id);
        return students.Where(s => byEmail.ContainsKey(s.Email)).ToDictionary(s => s.Id, s => byEmail[s.Email]);
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

    /// <summary>
    /// The prototype's seeded chat: TomTheTutor messages Koala_Kai about his Calculus textbook. They already
    /// have a chat (one per pair), so this adds to it. Also runs on databases seeded before items existed.
    /// </summary>
    private static async Task SeedItemChatAsync(AppDbContext db, ILogger logger, List<SeedStudent> students)
    {
        var item = (Read<List<SeedItem>>("items.json") ?? []).FirstOrDefault(i => i.Label == "m01");
        if (item is null || !await db.MarketItems.AnyAsync(i => i.Id == item.Id)) return;
        if (await db.ChatMessages.AnyAsync(m => m.AboutType == ChatAboutType.Item && m.AboutId == item.Id)) return;

        var emails = students.Where(s => s.Id is "p01" or "p05").ToDictionary(s => s.Id, s => s.Email);
        var users = await db.Users.Where(u => emails.Values.Contains(u.Email)).ToDictionaryAsync(u => u.Email, u => u.Id);
        if (!users.TryGetValue(emails["p01"], out var kai) || !users.TryGetValue(emails["p05"], out var tom)) return;

        var (a, b) = Conversation.Order(kai, tom);
        var now = DateTimeOffset.UtcNow;
        var conv = await db.Conversations.FirstOrDefaultAsync(c => c.UserAId == a && c.UserBId == b);
        var existing = conv is not null;
        if (conv is null)
        {
            conv = new Conversation { UserAId = a, UserBId = b, CreatedAt = now.AddMinutes(-9) };
            db.Conversations.Add(conv);
        }

        db.ChatMessages.Add(new ChatMessage
        {
            ConversationId = conv.Id, Kind = ChatMessageKind.About, AboutType = ChatAboutType.Item, AboutId = item.Id,
            Body = ChatService.AboutItem(item.Title, item.Price), CreatedAt = now.AddMinutes(-9),
        });
        var at = now.AddMinutes(-8);
        db.ChatMessages.Add(new ChatMessage
        {
            ConversationId = conv.Id, SenderId = tom, Kind = ChatMessageKind.Text, CreatedAt = at,
            Body = (existing ? "Also, saw" : "Hey! Saw") +
                " you looking at my Calculus textbook — still available if you want it. Barr Smith works for me.",
        });
        conv.LastMessageAt = at;
        conv.MarkRead(tom, at);

        await db.SaveChangesAsync();
        logger.LogWarning("Seeded the Calculus textbook chat (TomTheTutor → Koala_Kai)");
    }

    private static T? Read<T>(string file)
    {
        var path = Path.Combine(AppContext.BaseDirectory, "Data", "Seed", file);
        return File.Exists(path) ? JsonSerializer.Deserialize<T>(File.ReadAllText(path), Json) : default;
    }
}
