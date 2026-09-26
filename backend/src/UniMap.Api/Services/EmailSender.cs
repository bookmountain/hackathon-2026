namespace UniMap.Api.Services;

public interface IEmailSender
{
    Task SendVerificationCodeAsync(string email, string code);
}

/// <summary>Dev stand-in: logs the code instead of emailing it. Swap for Resend/SES/SMTP later.</summary>
public class LoggingEmailSender(ILogger<LoggingEmailSender> log) : IEmailSender
{
    public Task SendVerificationCodeAsync(string email, string code)
    {
        log.LogWarning("Verification code for {Email}: {Code}", email, code);
        return Task.CompletedTask;
    }
}
