using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using UniMap.Api.Contracts;
using UniMap.Api.Data;
using UniMap.Api.Domain;

namespace UniMap.Api.Controllers;

/// <summary>
/// Step-by-step dropdowns for picking a degree: level → college → degree.
/// University comes from the student's email, so the frontend already knows it (GET /api/me).
/// </summary>
[ApiController]
[Route("api/degrees")]
public class DegreesController(AppDbContext db) : ControllerBase
{
    /// <summary>Step 1: levels available at a university (Undergraduate / Postgraduate / Research).</summary>
    [HttpGet("levels")]
    public async Task<List<DegreeOption<DegreeLevel>>> Levels([FromQuery] University university)
    {
        var rows = await db.Degrees.AsNoTracking()
            .Where(d => d.University == university)
            .GroupBy(d => d.Level)
            .Select(g => new { g.Key, Count = g.Count() })
            .ToListAsync();
        return rows.OrderBy(r => r.Key).Select(r => new DegreeOption<DegreeLevel>(r.Key, r.Count)).ToList();
    }

    /// <summary>Step 2: colleges (departments) offering degrees at that level.</summary>
    [HttpGet("colleges")]
    public async Task<List<DegreeOption<string>>> Colleges([FromQuery] University university, [FromQuery] DegreeLevel level)
    {
        var rows = await db.Degrees.AsNoTracking()
            .Where(d => d.University == university && d.Level == level)
            .GroupBy(d => d.College)
            .Select(g => new { g.Key, Count = g.Count() })
            .ToListAsync();
        // "Other" (course page didn't name a college) goes last.
        return rows.OrderBy(r => r.Key == "Other").ThenBy(r => r.Key)
            .Select(r => new DegreeOption<string>(r.Key, r.Count)).ToList();
    }

    /// <summary>
    /// Step 3: the degrees themselves. Filter by level and college for the dropdowns, or use
    /// <paramref name="search"/> for a type-ahead box (e.g. "nursing").
    /// </summary>
    [HttpGet]
    public async Task<List<DegreeDto>> List(
        [FromQuery] University university,
        [FromQuery] DegreeLevel? level,
        [FromQuery] string? college,
        [FromQuery] string? search)
    {
        var q = db.Degrees.AsNoTracking().Where(d => d.University == university);
        if (level is not null) q = q.Where(d => d.Level == level);
        if (!string.IsNullOrWhiteSpace(college)) q = q.Where(d => d.College == college);
        if (!string.IsNullOrWhiteSpace(search)) q = q.Where(d => EF.Functions.ILike(d.Name, $"%{search.Trim()}%"));

        return await q.OrderBy(d => d.Name)
            .Select(d => new DegreeDto(d.Id, d.University, d.Level, d.AwardType, d.Name, d.College,
                d.Campuses, d.IsDoubleDegree, d.Url))
            .ToListAsync();
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<DegreeDto>> Get(int id)
    {
        var d = await db.Degrees.AsNoTracking().FirstOrDefaultAsync(d => d.Id == id);
        if (d is null) return NotFound();
        return new DegreeDto(d.Id, d.University, d.Level, d.AwardType, d.Name, d.College, d.Campuses, d.IsDoubleDegree, d.Url);
    }
}
