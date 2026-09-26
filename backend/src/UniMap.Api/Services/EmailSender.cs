using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.Extensions.Options;
using MimeKit;
using UniMap.Api.Options;

namespace UniMap.Api.Services;

public interface IEmailSender
{
    Task SendVerificationCodeAsync(string email, string code);
}

/// <summary>Fallback when no SMTP host is configured: logs the code instead of emailing it.</summary>
public class LoggingEmailSender(ILogger<LoggingEmailSender> log) : IEmailSender
{
    public Task SendVerificationCodeAsync(string email, string code)
    {
        log.LogWarning("Verification code for {Email}: {Code}", email, code);
        return Task.CompletedTask;
    }
}

/// <summary>
/// Plain SMTP, so any provider works: Mailpit locally, or Resend / Brevo / Gmail (app password) for real.
/// </summary>
public class SmtpEmailSender(IOptions<EmailOptions> options, ILogger<SmtpEmailSender> log) : IEmailSender
{
    private readonly EmailOptions _opt = options.Value;

    public async Task SendVerificationCodeAsync(string email, string code)
    {
        var msg = new MimeMessage();
        msg.From.Add(MailboxAddress.Parse(_opt.From));
        msg.To.Add(MailboxAddress.Parse(email));
        msg.Subject = $"{code} is your UniMap verification code";
        msg.Body = new BodyBuilder
        {
            TextBody = $"Your UniMap verification code is {code}. It expires in 15 minutes.",
            HtmlBody = $"""
                <div style="font-family:sans-serif;max-width:420px">
                  <h2>Welcome to UniMap</h2>
                  <p>Your verification code is:</p>
                  <p style="font-size:32px;font-weight:bold;letter-spacing:6px">{code}</p>
                  <p style="color:#666">It expires in 15 minutes. If you didn't sign up, ignore this email.</p>
                </div>
                """,
        }.ToMessageBody();

        var security = _opt.Security.ToLowerInvariant() switch
        {
            "none" => SecureSocketOptions.None,
            "starttls" => SecureSocketOptions.StartTls,
            "tls" or "ssl" => SecureSocketOptions.SslOnConnect,
            _ => SecureSocketOptions.Auto,
        };

        using var smtp = new SmtpClient();
        await smtp.ConnectAsync(_opt.Host!, _opt.Port, security); // only registered when Host is set
        if (!string.IsNullOrEmpty(_opt.Username))
            await smtp.AuthenticateAsync(_opt.Username, _opt.Password ?? "");
        await smtp.SendAsync(msg);
        await smtp.DisconnectAsync(true);
        log.LogInformation("Sent verification code to {Email}", email);
    }
}
