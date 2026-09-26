using System.Text.Json;
using System.Text.Json.Nodes;
using System.Text.Json.Serialization;
using Microsoft.EntityFrameworkCore;
using Microsoft.OpenApi;
using Swashbuckle.AspNetCore.SwaggerGen;
using UniMap.Api.Contracts;
using UniMap.Api.Data;
using UniMap.Api.Domain;

namespace UniMap.Api.Swagger;

/// <summary>
/// Pre-fills every request body in Swagger UI with a complete, working example.
/// Login uses a seeded account, so "Try it out" → "Execute" works immediately.
/// </summary>
public class RequestExamplesFilter(IServiceScopeFactory scopes) : ISchemaFilter
{
    private static readonly JsonSerializerOptions Json = new(JsonSerializerDefaults.Web)
    {
        Converters = { new JsonStringEnumConverter() },
    };

    // Deprecated fields are left out of the examples so nobody copies them.
    private static readonly string[] HiddenFields = ["ageRange", "nationality"];

    public void Apply(IOpenApiSchema schema, SchemaFilterContext context)
    {
        if (schema is not OpenApiSchema s || Example(context.Type) is not { } example) return;

        var node = JsonSerializer.SerializeToNode(example, context.Type, Json)!.AsObject();
        foreach (var field in HiddenFields) node.Remove(field);
        s.Example = node;
    }

    private object? Example(Type type) => type switch
    {
        _ when type == typeof(RegisterRequest) => new RegisterRequest("a1234567@adelaide.edu.au", "password123"),
        _ when type == typeof(VerifyEmailRequest) => new VerifyEmailRequest("a1234567@adelaide.edu.au", "123456"),
        _ when type == typeof(ResendCodeRequest) => new ResendCodeRequest("a1234567@adelaide.edu.au"),
        _ when type == typeof(LoginRequest) => new LoginRequest("a1900000@adelaide.edu.au", DevSeeder.Password),
        _ when type == typeof(UpsertProfileRequest) => new UpsertProfileRequest(
            DisplayName: "Alex",
            DegreeId: ExampleDegreeId(),
            Department: null,
            Gender: Gender.PreferNotToSay,
            Pronouns: "they/them",
            AgeRange: null,
            Nationality: null,
            YearOfStudy: 2,
            Bio: "Second-year CS student, keen for study buddies and weekend hikes.",
            Habits: ["night-owl", "gym", "coffee", "studies-in-library"],
            Interests: ["coding", "hackathons", "hiking", "board-games"],
            AvatarKey: null,
            AvatarPreset: 2,
            AvatarDesign: new AvatarDesign(AvatarStyle.Icon, null, AvatarIcon.Coffee, AvatarShape.Squircle, AvatarRing.Gold)),
        _ when type == typeof(UploadUrlRequest) => new UploadUrlRequest("image/jpeg"),
        _ when type == typeof(UpsertFlatRequest) => new UpsertFlatRequest(
            Id: null,
            Title: "Sunny room, 6 min to North Tce",
            Description: "Bright front room in a renovated sandstone cottage. Ensuite, big desk by the window.",
            Suburb: "Adelaide",
            Street: "Frome St",
            Lat: -34.9217,
            Lng: 138.6073,
            RentPerWeek: 245,
            BillsPerWeek: 25,
            Bedrooms: 3,
            Flatmates: 2,
            Toilet: ToiletType.PrivateEnsuite,
            Bathroom: BathroomType.Ensuite,
            Furnished: Furnishing.Fully,
            MinStayMonths: 3,
            AvailableFrom: DateOnly.FromDateTime(DateTime.UtcNow.AddDays(14)),
            Features: ["Air con", "Double bed", "Desk", "Wi-Fi included"],
            HouseRhythm: ["Quiet weeknights", "Shared dinners"],
            PreferredFlatmate: "Quiet, non-smoker, late study OK",
            Housemates: ["Adelaide · Computer Science", "Flinders · Law"],
            PhotoKeys: []),
        _ when type == typeof(FlatPhotoUploadRequest) => new FlatPhotoUploadRequest("image/jpeg", null),
        _ when type == typeof(UpdateConsentsRequest) => new UpdateConsentsRequest(
            Terms: true, Location: true, AgeAndEnrolment: true, UsageStats: false),
        _ when type == typeof(FlatStatusRequest) => new FlatStatusRequest(ListingStatus.Taken),
        _ when type == typeof(ItemPhotoUploadRequest) => new ItemPhotoUploadRequest("image/jpeg", null),
        // id and photoKeys are placeholders: replace them with the itemId and key from POST
        // /api/uploads/item-photo after uploading the image, or the server answers "hasn't been uploaded yet".
        _ when type == typeof(UpsertItemRequest) => new UpsertItemRequest(
            Id: ExampleItemId,
            Title: "Chemistry textbook, 3rd ed.",
            Price: 30,
            Description: "Used for first-year chem. A few pencil notes, no torn pages. Free to meet after 4pm.",
            Category: ItemCategory.Textbooks,
            Condition: ItemCondition.Good,
            ConditionNote: "a few pencil notes",
            Availability: ItemAvailability.Now,
            AvailableFrom: null,
            PickupPointId: "barr-smith-library",
            PlaceName: null,
            Lat: null,
            Lng: null,
            PhotoKeys: [$"items/{ExampleItemId}/9c1e5a4b2f7d4e0c8a3b6d1f2e4c7a90.jpg"]),
        _ when type == typeof(ItemAvailabilityRequest) => new ItemAvailabilityRequest(
            ItemAvailability.From, DateOnly.FromDateTime(DateTime.UtcNow.AddDays(5))),
        // Friday coffee & code (the Host form's placeholder), at a preset place with a detail in placeName.
        _ when type == typeof(UpsertEventRequest) => new UpsertEventRequest(
            Title: "Friday coffee & code",
            Type: EventType.Casual,
            StartsAt: InAdelaide(NextFriday(), new TimeOnly(8, 30)),
            EndsAt: InAdelaide(NextFriday(), new TimeOnly(10, 0)),
            Description: "Bring a laptop and whatever you're building. All levels welcome, no one checks your code.",
            PlaceId: "barr-smith-library",
            PlaceName: "Barr Smith Library, ground floor",
            Lat: null,
            Lng: null,
            Capacity: MeetupCatalog.DefaultCapacity,
            WalkInsWelcome: true),
        // Koala_Kai (the login example) messaging TomTheTutor about his seeded Calculus textbook.
        _ when type == typeof(StartChatRequest) => new StartChatRequest(
            UserId: null, FlatId: null, ItemId: SeedCalculusTextbookId, DrawId: null,
            Text: "Hi! Is the calculus textbook still available?"),
        _ when type == typeof(SendMessageRequest) => new SendMessageRequest("Great — see you at Barr Smith after 4pm!"),
        _ => null,
    };

    private static DateOnly NextFriday()
    {
        var today = AdelaideTime.Today();
        var days = ((int)DayOfWeek.Friday - (int)today.DayOfWeek + 7) % 7;
        return today.AddDays(days == 0 ? 7 : days);
    }

    /// <summary>With Adelaide's UTC offset, e.g. 2026-10-02T08:30:00+09:30, so the example reads naturally.</summary>
    private static DateTimeOffset InAdelaide(DateOnly date, TimeOnly time) =>
        TimeZoneInfo.ConvertTime(AdelaideTime.ToUtc(date, time), AdelaideTime.Zone);

    private static readonly Guid ExampleItemId = Guid.Parse("5b0c3e2a-8f41-4d7e-9a26-1c7f0e9d4b83");

    /// <summary>m01 in items.json.</summary>
    private static readonly Guid SeedCalculusTextbookId = Guid.Parse("f0de4bd7-d359-54b6-9baf-225c93f7be2e");

    /// <summary>Real id of Adelaide's Bachelor of Computer Science, matching the Adelaide login example.</summary>
    private int? ExampleDegreeId()
    {
        using var scope = scopes.CreateScope();
        return scope.ServiceProvider.GetRequiredService<AppDbContext>().Degrees
            .Where(d => d.University == University.Adelaide && d.Name == "Bachelor of Computer Science")
            .Select(d => (int?)d.Id)
            .FirstOrDefault();
    }
}
