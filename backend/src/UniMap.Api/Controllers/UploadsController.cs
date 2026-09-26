using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using UniMap.Api.Contracts;
using UniMap.Api.Data;
using UniMap.Api.Services;

namespace UniMap.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/uploads")]
public class UploadsController(StorageService storage, AppDbContext db) : ControllerBase
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
    public ActionResult<UploadUrlResponse> Avatar(UploadUrlRequest req) => Presign(req, $"avatars/{User.UserId()}");

    /// <summary>
    /// Room photos, stored one folder per listing: flats/{listingId}/. For a new listing, leave
    /// listingId null on the first photo; reuse the returned listingId for the other photos and as
    /// "id" on POST /api/flats. Then send all the keys in photoKeys.
    /// </summary>
    [HttpPost("flat-photo")]
    public async Task<ActionResult<FlatPhotoUploadResponse>> FlatPhoto(FlatPhotoUploadRequest req)
    {
        var listingId = req.ListingId ?? Guid.NewGuid();
        // An existing listing must be yours; an unknown id is a listing that's still being written.
        var ownerId = await db.FlatListings.Where(f => f.Id == listingId).Select(f => (Guid?)f.OwnerId).FirstOrDefaultAsync();
        if (ownerId is not null && ownerId != User.UserId()) return NotFound();

        var result = Presign(new UploadUrlRequest(req.ContentType), $"flats/{listingId}");
        if (result.Value is not { } up) return result.Result!;
        return new FlatPhotoUploadResponse(listingId, up.UploadUrl, up.Key, up.ReadUrl, up.ExpiresAt);
    }

    /// <param name="folder">Full folder, e.g. "avatars/{userId}" or "flats/{listingId}".</param>
    private ActionResult<UploadUrlResponse> Presign(UploadUrlRequest req, string folder)
    {
        if (!storage.IsConfigured)
            return Problem("Image storage (R2) is not configured.", statusCode: StatusCodes.Status503ServiceUnavailable);
        if (!AllowedTypes.TryGetValue(req.ContentType, out var ext))
            return Problem("Only JPEG, PNG or WebP.", statusCode: StatusCodes.Status400BadRequest);

        var key = $"{folder}/{Guid.NewGuid():N}.{ext}";
        var (url, exp) = storage.PresignPut(key, req.ContentType);
        return new UploadUrlResponse(url, key, storage.ReadUrl(key), exp);
    }
}
