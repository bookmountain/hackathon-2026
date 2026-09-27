namespace UniMap.Api.Services;

/// <summary>Search-box patterns for EF.Functions.ILike, with % and _ taken literally.</summary>
public static class SqlLike
{
    /// <summary>The escape character to pass to ILike.</summary>
    public const string Escape = @"\";

    /// <summary>"%{search}%", trimmed and escaped.</summary>
    public static string Contains(string search) =>
        $"%{search.Trim().Replace(@"\", @"\\").Replace("%", @"\%").Replace("_", @"\_")}%";
}
