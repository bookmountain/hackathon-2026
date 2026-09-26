using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using UniMap.Api.Contracts;
using UniMap.Api.Data;
using UniMap.Api.Domain;
using UniMap.Api.Services;

namespace UniMap.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/me")]
public class MeController(AppDbContext db, StorageService storage, MatchingService matching) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<MeResponse>> Get()
    {
        var user = await db.Users.Include(u => u.Profile).ThenInclude(p => p!.Degree)
            .FirstOrDefaultAsync(u => u.Id == User.UserId());
        if (user is null) return NotFound();

        var profile = user.Profile is null ? null : MatchingService.ToDto(user.Profile, storage);
        return new MeResponse(user.Id, user.Email, user.University, profile);
    }

    /// <summary>
    /// Create or update the onboarding questionnaire. Pick the degree with the /api/degrees dropdowns and
    /// send its id; department is then filled in from the degree's college.
    /// </summary>
    [HttpPut("profile")]
    public async Task<ActionResult<ProfileDto>> UpsertProfile(UpsertProfileRequest req)
    {
        var userId = User.UserId();
        var user = await db.Users.Include(u => u.Profile).FirstOrDefaultAsync(u => u.Id == userId);
        if (user is null) return NotFound();

        Degree? degree = null;
        if (req.DegreeId is { } degreeId)
        {
            degree = await db.Degrees.FirstOrDefaultAsync(d => d.Id == degreeId);
            if (degree is null || degree.University != user.University)
                return Problem($"Degree {degreeId} doesn't exist at {user.University}. See GET /api/degrees.",
                    statusCode: StatusCodes.Status400BadRequest);
        }
        else if (string.IsNullOrWhiteSpace(req.Department))
        {
            return Problem("Send a degreeId (preferred) or a department.", statusCode: StatusCodes.Status400BadRequest);
        }

        if (req.AvatarKey is not null && !req.AvatarKey.StartsWith($"avatars/{userId}/"))
            return Problem("Invalid avatar key.", statusCode: StatusCodes.Status400BadRequest);

        var p = user.Profile ??= new Profile { UserId = userId, DisplayName = "", Department = "" };
        p.DisplayName = req.DisplayName.Trim();
        p.DegreeId = degree?.Id;
        p.Degree = degree;
        p.Department = degree?.College ?? req.Department!.Trim();
        p.Gender = req.Gender;
        p.Pronouns = string.IsNullOrWhiteSpace(req.Pronouns) ? null : req.Pronouns.Trim();
        p.YearOfStudy = req.YearOfStudy;
        p.Bio = req.Bio?.Trim();
        p.Habits = Catalog.Normalize(req.Habits);
        p.Interests = Catalog.Normalize(req.Interests);
        p.AvatarKey = req.AvatarKey;
        p.UpdatedAt = DateTimeOffset.UtcNow;

        await db.SaveChangesAsync();
        await matching.InvalidateAsync(userId);
        return MatchingService.ToDto(p, storage);
    }
}
