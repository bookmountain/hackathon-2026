using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Nodes;
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
/// Looks at a photo with a vision model: fills in the Sell and "List a room" forms, and turns a photo into a
/// market search. The model is a local one on Ollama when Ollama:BaseUrl is set, otherwise Claude when
/// Anthropic:ApiKey is. The photo is only sent to the model, never stored.
/// </summary>
public class PhotoAiService(
    IOptions<AnthropicOptions> options,
    IOptions<OllamaOptions> ollamaOptions,
    IHttpClientFactory http,
    ILogger<PhotoAiService> log)
{
    private readonly AnthropicOptions opts = options.Value;
    private readonly OllamaOptions ollama = ollamaOptions.Value;
    private readonly Lazy<AnthropicClient> client = new(() => new AnthropicClient { ApiKey = options.Value.ApiKey });

    /// <summary>The named HttpClient for Ollama (Program.cs sets its base address and timeout).</summary>
    public const string OllamaClient = "ollama";

    private static readonly JsonSerializerOptions Json = new(JsonSerializerDefaults.Web)
    {
        Converters = { new JsonStringEnumConverter(allowIntegerValues: false) },
    };

    public bool IsConfigured => ollama.IsConfigured || opts.IsConfigured;

    /// <summary>The 503 when there's neither Ollama:BaseUrl nor Anthropic:ApiKey, and its ProblemDetails code.</summary>
    public const string NotConfigured = "AI photo analysis isn't switched on for this server.",
        NotConfiguredCode = "ai_not_configured";

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
        if (ollama.IsConfigured) return Parse<T>(await AskOllamaAsync(photo, prompt, schema, ct), "Ollama");
        if (!opts.IsConfigured)
            throw new PhotoAiException(StatusCodes.Status503ServiceUnavailable, NotConfigured);
        return Parse<T>(await AskClaudeAsync(photo, prompt, WithoutArrayLimits(schema), ct), "Claude");
    }

    private T Parse<T>(string text, string source)
    {
        try
        {
            return JsonSerializer.Deserialize<T>(text, Json)
                ?? throw new JsonException("Empty answer");
        }
        catch (JsonException e)
        {
            // Both models are held to the schema, so this means the answer was cut off
            log.LogError(e, "Unreadable photo analysis from {Source}: {Text}", source, text);
            throw new PhotoAiException(StatusCodes.Status502BadGateway, "Photo analysis is unavailable right now. Try again.");
        }
    }

    /// <summary>Ollama's /api/chat, with the schema as its required output format.</summary>
    private async Task<string> AskOllamaAsync(Photo photo, string prompt, Dictionary<string, JsonElement> schema, CancellationToken ct)
    {
        try
        {
            using var res = await http.CreateClient(OllamaClient).PostAsJsonAsync("api/chat", new
            {
                model = ollama.Model,
                stream = false,
                format = schema,
                think = false,
                // The model's own sampling: at temperature 0 small models loop ("No pets. No smoking. No pets…").
                // A photo is about 1,000 tokens and an answer a few hundred, so 2,048 of context keeps an 8B model
                // entirely on an 8 GB GPU, and num_predict stops a runaway answer early.
                options = new { num_ctx = 2048, num_predict = 600 },
                messages = new[]
                {
                    // Small models follow the schema better when the prompt asks for JSON too
                    new { role = "user", content = prompt + " Answer in JSON.", images = new[] { photo.Base64 } },
                },
            }, ct);
            if (!res.IsSuccessStatusCode)
            {
                log.LogError("Ollama answered {Status}: {Body}", (int)res.StatusCode, await res.Content.ReadAsStringAsync(ct));
                throw new PhotoAiException(StatusCodes.Status502BadGateway, "Photo analysis is unavailable right now. Try again.");
            }
            var body = await res.Content.ReadFromJsonAsync<OllamaChatResponse>(ct);
            return body?.Message?.Content ?? "";
        }
        catch (Exception e) when (e is HttpRequestException or TaskCanceledException && !ct.IsCancellationRequested)
        {
            // The PC with the model is off, asleep or unreachable, or took too long
            log.LogWarning(e, "Couldn't reach Ollama at {BaseUrl}", ollama.BaseUrl);
            throw new PhotoAiException(StatusCodes.Status503ServiceUnavailable, "Photo analysis is unavailable right now. Try again.");
        }
    }

    private record OllamaChatResponse(OllamaMessage? Message);

    private record OllamaMessage(string? Content);

    private async Task<string> AskClaudeAsync(Photo photo, string prompt, Dictionary<string, JsonElement> schema, CancellationToken ct)
    {
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

        return string.Concat(response.Content.Select(b => b.Value).OfType<TextBlock>().Select(t => t.Text));
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
        "the main colour palette in at most 4 words, how furnished it is, the features you can see in the photo " +
        "(leave out anything you can't see), 2 friendly sentences describing the room for students, and 3 short reasons a student would like " +
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
        benefits = Arr(Str(), 3),
    });

    private static readonly Dictionary<string, JsonElement> RoomSchema = Schema(new
    {
        title = Str(),
        style = Str(),
        colours = Str(),
        furnished = EnumOf<Furnishing>(),
        features = Arr(new { type = "string", @enum = FlatCatalog.Features }, FlatCatalog.Features.Length),
        description = Str(),
        benefits = Arr(Str(), 3),
    });

    private static readonly Dictionary<string, JsonElement> SearchSchema = Schema(new
    {
        label = Str(),
        category = new { type = "string", @enum = Enum.GetNames<ItemCategory>().Append("Other").ToArray() },
        keywords = Arr(Str(), 4),
    });

    private static object Str() => new { type = "string" };

    /// <summary>
    /// A list of at most <paramref name="max"/>. The limit stops a small local model repeating an item until it
    /// runs out of room ("Double bed", "Double bed", …). Claude's structured outputs don't accept it, so
    /// <see cref="WithoutArrayLimits"/> takes it out for Claude.
    /// </summary>
    private static object Arr(object items, int max) => new { type = "array", items, maxItems = max };

    private static Dictionary<string, JsonElement> WithoutArrayLimits(Dictionary<string, JsonElement> schema)
    {
        var props = JsonNode.Parse(schema["properties"].GetRawText())!.AsObject();
        foreach (var (_, prop) in props) prop?.AsObject().Remove("maxItems");
        return new(schema) { ["properties"] = JsonSerializer.SerializeToElement(props) };
    }

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

    /// <summary>
    /// Reads base64 (optionally a data: URL) holding a JPEG, PNG, GIF or WebP, recognised by its first bytes.
    /// Null if it's none of those, or too big.
    /// </summary>
    public static Photo? FromBase64(string? image)
    {
        if (string.IsNullOrWhiteSpace(image)) return null;
        var comma = image.StartsWith("data:", StringComparison.Ordinal) ? image.IndexOf(',') : -1;
        var base64 = comma >= 0 ? image[(comma + 1)..] : image;
        if (base64.Length > MaxBytes * 4 / 3 + 4) return null;
        byte[] bytes;
        try { bytes = Convert.FromBase64String(base64); }
        catch (FormatException) { return null; }
        if (bytes.Length is 0 or > (int)MaxBytes) return null;
        var b = bytes.AsSpan();

        MediaType? type =
            b.StartsWith((byte[])[0xFF, 0xD8, 0xFF]) ? MediaType.ImageJpeg :
            b.StartsWith((byte[])[0x89, 0x50, 0x4E, 0x47]) ? MediaType.ImagePng :
            b.StartsWith("GIF8"u8) ? MediaType.ImageGif :
            b.Length > 12 && b.StartsWith("RIFF"u8) && b[8..12].SequenceEqual("WEBP"u8) ? MediaType.ImageWebP :
            null;
        return type is { } t ? new Photo(base64, t) : null;
    }
}
