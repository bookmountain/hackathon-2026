using Amazon.Runtime;
using Amazon.S3;
using Amazon.S3.Model;
using Microsoft.Extensions.Options;
using UniMap.Api.Options;

namespace UniMap.Api.Services;

/// <summary>Cloudflare R2 via its S3-compatible API. Clients upload directly with a presigned PUT URL.</summary>
public class StorageService
{
    private readonly R2Options _opt;
    private readonly AmazonS3Client? _s3;

    public StorageService(IOptions<R2Options> options)
    {
        _opt = options.Value;
        if (!_opt.IsConfigured) return;

        _s3 = new AmazonS3Client(
            new BasicAWSCredentials(_opt.AccessKeyId, _opt.SecretAccessKey),
            new AmazonS3Config
            {
                ServiceURL = $"https://{_opt.AccountId}.r2.cloudflarestorage.com",
                AuthenticationRegion = "auto",
                ForcePathStyle = true,
                // R2 doesn't support the SDK's newer default checksum headers.
                RequestChecksumCalculation = RequestChecksumCalculation.WHEN_REQUIRED,
                ResponseChecksumValidation = ResponseChecksumValidation.WHEN_REQUIRED,
            });
    }

    public bool IsConfigured => _s3 is not null;

    public (string Url, DateTimeOffset ExpiresAt) PresignPut(string key, string contentType)
    {
        if (_s3 is null) throw new InvalidOperationException("R2 is not configured.");
        var expires = DateTimeOffset.UtcNow.AddMinutes(10);
        var url = _s3.GetPreSignedURL(new GetPreSignedUrlRequest
        {
            BucketName = _opt.Bucket,
            Key = key,
            Verb = HttpVerb.PUT,
            ContentType = contentType,
            Expires = expires.UtcDateTime,
        });
        return (url, expires);
    }

    public string? PublicUrl(string? key) =>
        key is null || string.IsNullOrWhiteSpace(_opt.PublicBaseUrl) ? null : $"{_opt.PublicBaseUrl.TrimEnd('/')}/{key}";
}
