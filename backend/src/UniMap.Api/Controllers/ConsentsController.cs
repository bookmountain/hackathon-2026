using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using UniMap.Api.Contracts;
using UniMap.Api.Data;
using UniMap.Api.Domain;
using UniMap.Api.Services;

namespace UniMap.Api.Controllers;

/// <summary>
/// The "Before you start" screen. Shown after email verification and before the profile.
/// Every answer is kept with a timestamp; withdrawing a required consent locks the app again.
/// </summary>
[ApiController]
[Authorize(Policy = ConsentPolicy.SignedInOnly)]
[Route("api/consents")]
public class ConsentsController(AppDbContext db, ConsentService consents) : ControllerBase
{
    /// <summary>The four consents, their wording, and your current answers.</summary>
    [HttpGet]
    public async Task<ConsentStatus> Get() => await Status(User.UserId());

    /// <summary>"I agree &amp; continue", or changes from "Review my consents" in the profile.</summary>
    [HttpPut]
    public async Task<ConsentStatus> Update(UpdateConsentsRequest req)
    {
        var me = User.UserId();
        var current = await consents.CurrentAsync(me);
        var answers = new Dictionary<ConsentType, bool?>
        {
            [ConsentType.Terms] = req.Terms,
            [ConsentType.Location] = req.Location,
            [ConsentType.AgeAndEnrolment] = req.AgeAndEnrolment,
            [ConsentType.UsageStats] = req.UsageStats,
        };

        foreach (var (type, granted) in answers)
        {
            if (granted is null) continue;
            if (current.TryGetValue(type, out var last) && last.Granted == granted) continue; // unchanged
            db.ConsentRecords.Add(new ConsentRecord
            {
                UserId = me, Type = type, Granted = granted.Value, PolicyVersion = ConsentPolicy.Version,
            });
        }
        await db.SaveChangesAsync();
        return await Status(me);
    }

    private async Task<ConsentStatus> Status(Guid me)
    {
        var current = await consents.CurrentAsync(me);
        var items = ConsentPolicy.All.Select(d =>
        {
            current.TryGetValue(d.Type, out var r);
            return new ConsentItem(d.Type, d.Label, d.Required, r?.Granted ?? false, r?.CreatedAt);
        }).ToList();
        return new ConsentStatus(ConsentPolicy.Version, items.Where(i => i.Required).All(i => i.Granted), items);
    }
}
