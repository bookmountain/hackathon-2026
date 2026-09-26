using System.Text.Json;
using System.Text.Json.Nodes;
using System.Text.Json.Serialization;
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
public class RequestExamplesFilter : ISchemaFilter
{
    private static readonly JsonSerializerOptions Json = new(JsonSerializerDefaults.Web)
    {
        Converters = { new JsonStringEnumConverter() },
    };

    private static readonly Dictionary<Type, object> Examples = new()
    {
        [typeof(RegisterRequest)] = new RegisterRequest("a1234567@adelaide.edu.au", "password123"),
        [typeof(VerifyEmailRequest)] = new VerifyEmailRequest("a1234567@adelaide.edu.au", "123456"),
        [typeof(ResendCodeRequest)] = new ResendCodeRequest("a1234567@adelaide.edu.au"),
        [typeof(LoginRequest)] = new LoginRequest("a1900000@adelaide.edu.au", DevSeeder.Password),
        [typeof(UpsertProfileRequest)] = new UpsertProfileRequest(
            DisplayName: "Alex",
            Department: "Computer Science",
            Gender: Gender.PreferNotToSay,
            YearOfStudy: 2,
            Bio: "Second-year CS student, keen for study buddies and weekend hikes.",
            Habits: ["night-owl", "gym", "coffee", "studies-in-library"],
            Interests: ["coding", "hackathons", "hiking", "board-games"],
            AvatarKey: null),
        [typeof(UploadUrlRequest)] = new UploadUrlRequest("image/jpeg"),
    };

    public void Apply(IOpenApiSchema schema, SchemaFilterContext context)
    {
        if (schema is OpenApiSchema s && Examples.TryGetValue(context.Type, out var example))
            s.Example = JsonSerializer.SerializeToNode(example, context.Type, Json);
    }
}
