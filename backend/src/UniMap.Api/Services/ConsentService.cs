using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using UniMap.Api.Data;
using UniMap.Api.Domain;

namespace UniMap.Api.Services;

public class ConsentService(AppDbContext db)
{
    /// <summary>Latest record per type (current policy version only), or none.</summary>
    public async Task<Dictionary<ConsentType, ConsentRecord>> CurrentAsync(Guid userId) =>
        (await db.ConsentRecords.AsNoTracking()
            .Where(c => c.UserId == userId && c.PolicyVersion == ConsentPolicy.Version)
            .ToListAsync())
        .GroupBy(c => c.Type)
        .ToDictionary(g => g.Key, g => g.OrderByDescending(c => c.CreatedAt).First());

    public async Task<bool> IsCompleteAsync(Guid userId)
    {
        var granted = await db.ConsentRecords.AsNoTracking()
            .Where(c => c.UserId == userId && c.PolicyVersion == ConsentPolicy.Version)
            .GroupBy(c => c.Type)
            .Select(g => new { Type = g.Key, Granted = g.OrderByDescending(c => c.CreatedAt).First().Granted })
            .Where(x => x.Granted)
            .Select(x => x.Type)
            .ToListAsync();
        return ConsentPolicy.Required.All(granted.Contains);
    }
}

/// <summary>Part of the default [Authorize] policy: signed in AND the required consents are granted.</summary>
public class ConsentRequirement : IAuthorizationRequirement;

public class ConsentHandler(ConsentService consents) : AuthorizationHandler<ConsentRequirement>
{
    protected override async Task HandleRequirementAsync(AuthorizationHandlerContext context, ConsentRequirement requirement)
    {
        if (context.User.Identity?.IsAuthenticated == true && await consents.IsCompleteAsync(context.User.UserId()))
            context.Succeed(requirement);
        else
            context.Fail(new AuthorizationFailureReason(this, ConsentPolicy.ConsentRequiredCode));
    }
}
