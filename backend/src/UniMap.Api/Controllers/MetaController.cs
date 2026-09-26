using Microsoft.AspNetCore.Mvc;
using UniMap.Api.Contracts;
using UniMap.Api.Domain;

namespace UniMap.Api.Controllers;

[ApiController]
[Route("api/meta")]
public class MetaController : ControllerBase
{
    /// <summary>Dropdown/tag options for the onboarding questionnaire.</summary>
    [HttpGet("options")]
    public OptionsResponse Options() => new(
        Enum.GetNames<University>(), Enum.GetNames<Gender>(), Catalog.Pronouns, Enum.GetValues<AgeRange>(),
        Countries.All, Catalog.Habits, Catalog.Interests);
}
