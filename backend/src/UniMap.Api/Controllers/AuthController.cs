using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using UniMap.Api.Contracts;
using UniMap.Api.Data;
using UniMap.Api.Domain;
using UniMap.Api.Options;
using UniMap.Api.Services;

namespace UniMap.Api.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController(
    AppDbContext db,
    IOptions<UniversityOptions> unis,
    VerificationCodeStore codes,
    IEmailSender email,
    TokenService tokens,
    ConsentService consents,
    IWebHostEnvironment env,
    IConfiguration config) : ControllerBase
{
    /// <summary>Register with a University of Adelaide or Flinders email. Sends a 6-digit verification code.</summary>
    [HttpPost("register")]
    public async Task<ActionResult<RegisterResponse>> Register(RegisterRequest req)
    {
        var addr = req.Email.Trim().ToLowerInvariant();
        if (unis.Value.Resolve(addr) is not { } uni)
            return Problem("Only University of Adelaide and Flinders University emails can register.",
                statusCode: StatusCodes.Status422UnprocessableEntity);

        var user = await db.Users.FirstOrDefaultAsync(u => u.Email == addr);
        if (user is { EmailVerified: true })
            return Problem("An account with this email already exists.", statusCode: StatusCodes.Status409Conflict);

        // Unverified re-registration just resets the password and re-sends the code.
        if (user is null)
        {
            user = new User { Email = addr, PasswordHash = BCrypt.Net.BCrypt.HashPassword(req.Password), University = uni };
            db.Users.Add(user);
        }
        else
        {
            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(req.Password);
        }
        await db.SaveChangesAsync();

        var code = await codes.CreateAsync(addr);
        await email.SendVerificationCodeAsync(addr, code);

        // Auth:ReturnDevCode lets the hosted demo API (no real email) hand the code to the mobile app too.
        var showCode = env.IsDevelopment() || config.GetValue<bool>("Auth:ReturnDevCode");
        return Ok(new RegisterResponse(user.Id, uni, "Verification code sent.", showCode ? code : null));
    }

    [HttpPost("verify")]
    public async Task<ActionResult<AuthResponse>> Verify(VerifyEmailRequest req)
    {
        var addr = req.Email.Trim().ToLowerInvariant();
        var user = await db.Users.Include(u => u.Profile).FirstOrDefaultAsync(u => u.Email == addr);
        if (user is null || !await codes.ConsumeAsync(addr, req.Code))
            return Problem("Invalid or expired code.", statusCode: StatusCodes.Status400BadRequest);

        user.EmailVerified = true;
        await db.SaveChangesAsync();

        var (token, exp) = tokens.Issue(user);
        return new AuthResponse(token, exp, await consents.IsCompleteAsync(user.Id), user.Profile is not null);
    }

    [HttpPost("resend-code")]
    public async Task<IActionResult> ResendCode(ResendCodeRequest req)
    {
        var addr = req.Email.Trim().ToLowerInvariant();
        var user = await db.Users.FirstOrDefaultAsync(u => u.Email == addr);
        // Same response either way so this can't be used to probe which emails exist.
        if (user is { EmailVerified: false })
        {
            var code = await codes.CreateAsync(addr);
            await email.SendVerificationCodeAsync(addr, code);
        }
        return Accepted();
    }

    [HttpPost("login")]
    public async Task<ActionResult<AuthResponse>> Login(LoginRequest req)
    {
        var addr = req.Email.Trim().ToLowerInvariant();
        var user = await db.Users.Include(u => u.Profile).FirstOrDefaultAsync(u => u.Email == addr);
        if (user is null || !BCrypt.Net.BCrypt.Verify(req.Password, user.PasswordHash))
            return Problem("Invalid email or password.", statusCode: StatusCodes.Status401Unauthorized);
        if (!user.EmailVerified)
            return Problem("Email not verified yet.", statusCode: StatusCodes.Status403Forbidden);

        var (token, exp) = tokens.Issue(user);
        return new AuthResponse(token, exp, await consents.IsCompleteAsync(user.Id), user.Profile is not null);
    }
}
