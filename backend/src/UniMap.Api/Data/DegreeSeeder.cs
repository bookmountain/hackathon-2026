using Microsoft.EntityFrameworkCore;
using Microsoft.VisualBasic.FileIO;
using UniMap.Api.Domain;

namespace UniMap.Api.Data;

/// <summary>
/// Loads the real course lists (Data/Seed/*.csv, researched from each uni's website) into the
/// degrees table. Reference data, so it runs in every environment, but only into an empty table.
/// </summary>
public static class DegreeSeeder
{
    private static readonly (string File, University University)[] Sources =
    [
        ("adelaide-university.csv", University.Adelaide),
        ("flinders-university.csv", University.Flinders),
    ];

    public static async Task SeedAsync(AppDbContext db, ILogger logger)
    {
        if (await db.Degrees.AnyAsync()) return;

        foreach (var (file, uni) in Sources)
        {
            var degrees = Load(Path.Combine(AppContext.BaseDirectory, "Data", "Seed", file), uni);
            db.Degrees.AddRange(degrees);
            logger.LogInformation("Loaded {Count} {University} degrees from {File}", degrees.Count, uni, file);
        }
        await db.SaveChangesAsync();
    }

    private static List<Degree> Load(string path, University uni)
    {
        using var parser = new TextFieldParser(path) { TextFieldType = FieldType.Delimited, HasFieldsEnclosedInQuotes = true };
        parser.SetDelimiters(",");
        var header = parser.ReadFields()!;
        int Col(string name) => Array.IndexOf(header, name);
        int level = Col("level"), award = Col("award_type"), name = Col("name"), college = Col("college"),
            campuses = Col("campuses"), dbl = Col("double_degree"), url = Col("url");

        // One row per (level, name): a 1-year honours year and the 4-year degree of the same name,
        // or the on-campus and online versions of a course, become one dropdown entry.
        var byKey = new Dictionary<(DegreeLevel, string), Degree>();
        while (parser.ReadFields() is { } f)
        {
            var d = new Degree
            {
                University = uni,
                Level = MapLevel(f[level]),
                AwardType = f[award].Trim(),
                Name = f[name].Trim(),
                // A few double degrees list two colleges ("A; B"); file them under the first.
                College = f[college].Split(';')[0].Trim() is { Length: > 0 } c ? c : "Other",
                Campuses = SplitList(f[campuses]),
                IsDoubleDegree = bool.TryParse(f[dbl], out var b) && b,
                Url = f[url].Trim(),
            };

            if (byKey.TryGetValue((d.Level, d.Name), out var existing))
            {
                existing.Campuses = existing.Campuses.Union(d.Campuses).ToList();
                if (existing.College == "Other") existing.College = d.College;
            }
            else
            {
                byKey[(d.Level, d.Name)] = d;
            }
        }
        return byKey.Values.ToList();
    }

    private static DegreeLevel MapLevel(string level) => level.Trim() switch
    {
        "Undergraduate" or "Honours" => DegreeLevel.Undergraduate,
        "Postgraduate coursework" => DegreeLevel.Postgraduate,
        "Research" => DegreeLevel.Research,
        _ => throw new InvalidDataException($"Unknown degree level '{level}'"),
    };

    private static List<string> SplitList(string value) =>
        value.Split(';', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries).Distinct().ToList();
}
