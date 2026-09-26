using System.Text.Json;
using System.Text.Json.Serialization;
using Anthropic;
using Anthropic.Exceptions;
using Anthropic.Models.Messages;
using Microsoft.Extensions.Options;
using UniMap.Api.Contracts;
using UniMap.Api.Domain;
using UniMap.Api.Options;

namespace UniMap.Api.Services;

/// <summary>Why a photo couldn't be analysed, with the status code to answer.</summary>
public class PhotoAiException(int statusCode, string message) : Exception(message)
{
    public int StatusCode { get; } = statusCode;
}

/// <summary>
/// Looks at a photo with Claude: fills in the Sell and "List a room" forms, and turns a photo into a market
/// search. The photo is only sent to Claude, never stored.
/// </summary>
public class PhotoAiService(IOptions<AnthropicOptions> options, ILogger<PhotoAiService> log)
{
    private readonly AnthropicOptions opts = options.Value;
    private readonly Lazy<AnthropicClient> client = new(() => new AnthropicClient { ApiKey = options.Value.ApiKey });

    private static readonly JsonSerializerOptions Json = new(JsonSerializerDefaults.Web)
    {
        Converters = { new JsonStringEnumConverter(allowIntegerValues: false) },
    };

    public bool IsConfigured => opts.IsConfigured;

    public async Task<ItemPhotoAnalysis> AnalyseItemAsync(Photo photo, CancellationToken ct)
    {
        var a = await AskAsync<ItemPhotoAnalysis>(photo, ItemPrompt, ItemSchema, ct);
        return a with
        {
            SuggestedPrice = Math.Max(0, a.SuggestedPrice),
            Benefits = a.Benefits.Take(3).ToList(),
        };
    }

    public async Task<RoomPhotoAnalysis> AnalyseRoomAsync(Photo photo, CancellationToken ct)
    {
        var a = await AskAsync<RoomPhotoAnalysis>(photo, RoomPrompt, RoomSchema, ct);
        return a with
        {
            Features = a.Features.Where(FlatCatalog.Features.Contains).Distinct().ToList(),
            Benefits = a.Benefits.Take(3).ToList(),
        };
    }

    public Task<PhotoSearchTerms> SearchTermsAsync(Photo photo, CancellationToken ct) =>
        AskAsync<PhotoSearchTerms>(photo, SearchPrompt, SearchSchema, ct);

    private async Task<T> AskAsync<T>(Photo photo, string prompt, Dictionary<string, JsonElement> schema, CancellationToken ct)
    {
        if (!opts.IsConfigured)
            throw new PhotoAiException(StatusCodes.Status503ServiceUnavailable,
                "Photo analysis isn't set up on this server (Anthropic:ApiKey).");

        Message response;
        try
        {
            response = await client.Value.Messages.Create(new MessageCreateParams
            {
                Model = opts.Model,
                MaxTokens = 4096,
                OutputConfig = new OutputConfig { Effort = Effort.Low, Format = new JsonOutputFormat { Schema = schema } },
                Messages =
                [
                    new()
                    {
                        Role = Role.User,
                        Content = new List<ContentBlockParam>
                        {
                            new ImageBlockParam { Source = new Base64ImageSource { Data = photo.Base64, MediaType = photo.MediaType } },
                            new TextBlockParam { Text = prompt },
                        },
                    },
                ],
            }, ct);
        }
        catch (AnthropicRateLimitException e)
        {
            log.LogWarning(e, "Claude rate limit while analysing a photo");
            throw new PhotoAiException(StatusCodes.Status503ServiceUnavailable, "Photo analysis is busy. Try again in a minute.");
        }
        catch (AnthropicApiException e)
        {
            log.LogError(e, "Claude call failed while analysing a photo");
            throw new PhotoAiException(StatusCodes.Status502BadGateway, "Photo analysis is unavailable right now. Try again.");
        }

        if (response.StopReason == "refusal")
            throw new PhotoAiException(StatusCodes.Status422UnprocessableEntity, "This photo can't be analysed. Try another one.");

        var text = string.Concat(response.Content.Select(b => b.Value).OfType<TextBlock>().Select(t => t.Text));
        try
        {
            return JsonSerializer.Deserialize<T>(text, Json)
                ?? throw new JsonException("Empty answer");
        }
        catch (JsonException e)
        {
            // Structured outputs make this rare: it means the answer was cut off (max_tokens)
            log.LogError(e, "Unreadable photo analysis ({StopReason}): {Text}", response.StopReason, text);
            throw new PhotoAiException(StatusCodes.Status502BadGateway, "Photo analysis is unavailable right now. Try again.");
        }
    }

    // Prompts from the UCompass prototype, with the app's own option values
    private const string ItemPrompt =
        "You help a university student in Adelaide, Australia list a second-hand item on a student marketplace. " +
        "Look at the photo and fill in the listing: a title of at most 6 words, the category and condition, the " +
        "main colour(s), the material and texture in at most 4 words, a typical student resale price in whole " +
        "Australian dollars, 2 friendly sentences describing the item for students, and 3 short benefits for a " +
        "student of at most 8 words each.";

    private const string RoomPrompt =
        "You help a university student in Adelaide, Australia list a spare room for student flatmates. Look at the " +
        "room photo and fill in the listing: a title of at most 7 words, the interior style in at most 3 words, " +
        "the main colour palette in at most 4 words, how furnished it is, the features that are visible or very " +
        "likely, 2 friendly sentences describing the room for students, and 3 short reasons a student would like " +
        "this room, of at most 8 words each.";

    private const string SearchPrompt =
        "A university student in Adelaide, Australia is searching a student second-hand marketplace with this " +
        "photo. Say what the item is in 1 to 3 words (the label), which category it belongs to (Other if none " +
        "fits), and up to 4 single search words a seller would put in the listing title, most specific first.";

    private static readonly Dictionary<string, JsonElement> ItemSchema = Schema(new
    {
        title = Str(),
        category = EnumOf<ItemCategory>(),
        condition = EnumOf<ItemCondition>(),
        colour = Str(),
        texture = Str(),
        suggestedPrice = new { type = "integer" },
        description = Str(),
        benefits = new { type = "array", items = Str() },
    });

    private static readonly Dictionary<string, JsonElement> RoomSchema = Schema(new
    {
        title = Str(),
        style = Str(),
        colours = Str(),
        furnished = EnumOf<Furnishing>(),
        features = new { type = "array", items = new { type = "string", @enum = FlatCatalog.Features } },
        description = Str(),
        benefits = new { type = "array", items = Str() },
    });

    private static readonly Dictionary<string, JsonElement> SearchSchema = Schema(new
    {
        label = Str(),
        category = new { type = "string", @enum = Enum.GetNames<ItemCategory>().Append("Other").ToArray() },
        keywords = new { type = "array", items = Str() },
    });

    private static object Str() => new { type = "string" };

    private static object EnumOf<TEnum>() where TEnum : struct, Enum =>
        new { type = "string", @enum = Enum.GetNames<TEnum>() };

    /// <summary>An object schema where every property is required.</summary>
    private static Dictionary<string, JsonElement> Schema(object properties)
    {
        var props = JsonSerializer.SerializeToElement(properties);
        return new()
        {
            ["type"] = JsonSerializer.SerializeToElement("object"),
            ["properties"] = props,
            ["required"] = JsonSerializer.SerializeToElement(props.EnumerateObject().Select(p => p.Name).ToArray()),
            ["additionalProperties"] = JsonSerializer.SerializeToElement(false),
        };
    }
}

/// <summary>An uploaded photo, checked to be an image Claude can read.</summary>
public record Photo(string Base64, MediaType MediaType)
{
    /// <summary>Claude takes up to 5 MB per image once base64-encoded, which is about 3.75 MB of file.</summary>
    public const long MaxBytes = 3_750_000;

    /// <summary>Reads a JPEG, PNG, GIF or WebP by its first bytes (phones don't always send a Content-Type).</summary>
    public static async Task<Photo?> ReadAsync(IFormFile file, CancellationToken ct)
    {
        if (file.Length is 0 or > MaxBytes) return null;
        using var ms = new MemoryStream();
        await file.CopyToAsync(ms, ct);
        var b = ms.GetBuffer().AsSpan(0, (int)ms.Length);

        MediaType? type =
            b.StartsWith((byte[])[0xFF, 0xD8, 0xFF]) ? MediaType.ImageJpeg :
            b.StartsWith((byte[])[0x89, 0x50, 0x4E, 0x47]) ? MediaType.ImagePng :
            b.StartsWith("GIF8"u8) ? MediaType.ImageGif :
            b.Length > 12 && b.StartsWith("RIFF"u8) && b[8..12].SequenceEqual("WEBP"u8) ? MediaType.ImageWebP :
            null;
        return type is { } t ? new Photo(Convert.ToBase64String(b), t) : null;
    }
}
