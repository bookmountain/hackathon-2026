using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using UniMap.Api.Contracts;
using UniMap.Api.Services;

namespace UniMap.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/uploads")]
public class UploadsController(StorageService storage) : ControllerBase
{
    private static readonly Dictionary<string, string> AllowedTypes = new()
    {
        ["image/jpeg"] = "jpg", ["image/png"] = "png", ["image/webp"] = "webp",
    };

    /// <summary>
    /// Get a presigned URL, PUT the image bytes to it (with the same Content-Type), then save
    /// the returned key via PUT /api/me/profile { avatarKey }.
    /// </summary>
    [HttpPost("avatar")]
    public ActionResult<UploadUrlResponse> Avatar(UploadUrlRequest req) => Presign(req, "avatars");

    /// <summary>
    /// Same flow for room photos: upload each one (up to 5), then send the keys in photoKeys on
    /// POST /api/flats or PUT /api/flats/{id}.
    /// </summary>
    [HttpPost("flat-photo")]
    public ActionResult<UploadUrlResponse> FlatPhoto(UploadUrlRequest req) => Presign(req, "flats");

    private ActionResult<UploadUrlResponse> Presign(UploadUrlRequest req, string folder)
    {
        if (!storage.IsConfigured)
            return Problem("Image storage (R2) is not configured.", statusCode: StatusCodes.Status503ServiceUnavailable);
        if (!AllowedTypes.TryGetValue(req.ContentType, out var ext))
            return Problem("Only JPEG, PNG or WebP.", statusCode: StatusCodes.Status400BadRequest);

        var key = $"{folder}/{User.UserId()}/{Guid.NewGuid():N}.{ext}";
        var (url, exp) = storage.PresignPut(key, req.ContentType);
        return new UploadUrlResponse(url, key, storage.ReadUrl(key), exp);
    }
}
