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
        var user = await db.Users.Include(u => u.Profile)
            .FirstOrDefaultAsync(u => u.Id == User.UserId());
        if (user is null) return NotFound();

        var profile = user.Profile is null ? null : MatchingService.ToDto(user.Profile, storage);
        return new MeResponse(user.Id, user.Email, user.University, profile);
    }

    /// <summary>Create or update the onboarding questionnaire (department, gender, habits, ...).</summary>
    [HttpPut("profile")]
    public async Task<ActionResult<ProfileDto>> UpsertProfile(UpsertProfileRequest req)
    {
        var userId = User.UserId();
        var user = await db.Users.Include(u => u.Profile).FirstOrDefaultAsync(u => u.Id == userId);
        if (user is null) return NotFound();

        if (req.AvatarKey is not null && !req.AvatarKey.StartsWith($"avatars/{userId}/"))
            return Problem("Invalid avatar key.", statusCode: StatusCodes.Status400BadRequest);

        var p = user.Profile ??= new Profile { UserId = userId, DisplayName = "", Department = "" };
        p.DisplayName = req.DisplayName.Trim();
        p.Department = req.Department.Trim();
        p.Gender = req.Gender;
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
