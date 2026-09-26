using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Authorization.Policy;
using Microsoft.AspNetCore.Mvc;
using UniMap.Api.Domain;

namespace UniMap.Api.Services;

/// <summary>Turns a failed consent check into 403 { code: "consent_required" } instead of an empty 403.</summary>
public class ConsentResultHandler : IAuthorizationMiddlewareResultHandler
{
    private readonly AuthorizationMiddlewareResultHandler _default = new();

    public async Task HandleAsync(RequestDelegate next, HttpContext context, AuthorizationPolicy policy, PolicyAuthorizationResult result)
    {
        var consentMissing = result.Forbidden && result.AuthorizationFailure?.FailureReasons
            .Any(r => r.Message == ConsentPolicy.ConsentRequiredCode) == true;
        if (!consentMissing)
        {
            await _default.HandleAsync(next, context, policy, result);
            return;
        }

        context.Response.StatusCode = StatusCodes.Status403Forbidden;
        await context.Response.WriteAsJsonAsync(new ProblemDetails
        {
            Status = StatusCodes.Status403Forbidden,
            Title = "Consent required",
            Detail = "Accept the required consents first: GET/PUT /api/consents.",
            Extensions = { ["code"] = ConsentPolicy.ConsentRequiredCode },
        }, options: null, contentType: "application/problem+json");
    }
}
