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
            AvatarKey: null),
        _ when type == typeof(UploadUrlRequest) => new UploadUrlRequest("image/jpeg"),
        _ when type == typeof(UpsertFlatRequest) => new UpsertFlatRequest(
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
        _ when type == typeof(FlatStatusRequest) => new FlatStatusRequest(ListingStatus.Taken),
        _ => null,
    };

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
