using Heartoza.DTO.Profile;
using Heartoza.Models;
using Heartoza.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using System.Security.Claims;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ProfileController : ControllerBase
{
    private readonly GiftBoxShopContext _db;
    private readonly IAvatarStorage _storage;
    private readonly AzureStorageOptions _az;
    public ProfileController(
    GiftBoxShopContext db,
    IAvatarStorage storage,
    IOptions<AzureStorageOptions> az)
    {
        _db = db;
        _storage = storage;
        _az = az.Value;
    }

    private int GetUserId() => int.Parse(
        User.FindFirstValue(ClaimTypes.NameIdentifier)
        ?? User.FindFirstValue(ClaimTypes.Name)
        ?? User.FindFirstValue("sub")!
    );

    // ==== helpers ====
    private static string BuildPublicUrl(Medium m, string? baseUrl = null)
    {
        if (!string.IsNullOrWhiteSpace(m.ExternalUrl)) return m.ExternalUrl!;
        if (!string.IsNullOrWhiteSpace(baseUrl)) return $"{baseUrl}/{m.BlobPath}".Replace("//", "/");
        return $"/{m.Container}/{m.BlobPath}".Replace("//", "/");
    }

    // ========= PROFILE =========

    [HttpGet("me")]
    public async Task<IActionResult> Me(CancellationToken ct)
    {
        var uid = GetUserId();

        var u = await _db.Users
            .AsNoTracking()
            .Where(x => x.UserId == uid)
            .Select(x => new
            {
                x.UserId,
                FullName = x.FullName ?? "",
                x.Email,
                x.Phone,
                Role = x.Role ?? "Customer",
                x.IsActive,
                x.CreatedAt,
                x.LastLoginAt,

                // avatar từ UserMedia → Media (ảnh primary đầu tiên)
                Avatar = x.UserMedia
    .OrderByDescending(um => um.IsPrimary)
    .ThenBy(um => um.SortOrder)
    .Select(um => new { um.MediaId })
    .FirstOrDefault(),


                Addresses = x.Addresses
                    .OrderByDescending(a => a.IsDefault)
                    .ThenBy(a => a.AddressId)
                    .Select(a => new
                    {
                        a.AddressId,
                        a.FullName,
                        a.Line1,
                        a.District,
                        a.City,
                        a.Country,
                        a.PostalCode,
                        a.Phone,
                        a.IsDefault
                    })
                    .ToList(),

                DefaultAddressId = x.Addresses
                    .Where(a => a.IsDefault)
                    .Select(a => (int?)a.AddressId)
                    .FirstOrDefault()
            })
            .FirstOrDefaultAsync(ct);

        if (u == null) return NotFound();

        // map nhỏ: chuẩn hóa Avatar.Url theo helper
        if (u.Avatar != null)
        {
            var m = await _db.Media.AsNoTracking().FirstOrDefaultAsync(x => x.MediaId == u.Avatar.MediaId, ct);
            if (m != null)
            {
                // sau khi lấy được m (Medium) của avatar:
                string avatarUrl;
                try
                {
                    if (_storage is BlobAvatarStorage blobSvc && !string.IsNullOrWhiteSpace(m.BlobPath))
                        avatarUrl = blobSvc.GenerateReadSasUrl(m.BlobPath, 10); // SAS 10 phút
                    else
                        avatarUrl = BuildPublicUrl(m, _az.BaseUrl); // fallback nếu container public
                }
                catch
                {
                    avatarUrl = BuildPublicUrl(m, _az.BaseUrl);
                }

                return Ok(new
                {
                    u.UserId,
                    u.FullName,
                    u.Email,
                    u.Phone,
                    u.Role,
                    u.IsActive,
                    u.CreatedAt,
                    u.LastLoginAt,
                    Avatar = new { m.MediaId, Url = avatarUrl },
                    u.Addresses,
                    u.DefaultAddressId
                });

            }
        }

        return Ok(new
        {
            u.UserId,
            u.FullName,
            u.Email,
            u.Phone,
            u.Role,
            u.IsActive,
            u.CreatedAt,
            u.LastLoginAt,
            Avatar = (object?)null,
            u.Addresses,
            u.DefaultAddressId
        });
    }

    [HttpPut("me")]
    public async Task<IActionResult> UpdateMe([FromBody] UpdateProfileRequest req, CancellationToken ct)
    {
        var uid = GetUserId();
        var u = await _db.Users.FirstOrDefaultAsync(x => x.UserId == uid, ct);
        if (u == null) return NotFound();

        if (!string.IsNullOrWhiteSpace(req.FullName)) u.FullName = req.FullName.Trim();
        if (!string.IsNullOrWhiteSpace(req.Phone)) u.Phone = req.Phone.Trim();

        await _db.SaveChangesAsync(ct);
        return Ok(new { message = "Cập nhật hồ sơ thành công." });
    }

    // ========= USER AVATAR / MEDIA (thử lưu nhanh) =========

    public sealed class CreateExternalAvatarRequest
    {
        public string Url { get; set; } = default!;
        public bool AsPrimary { get; set; } = true;
    }

    [HttpPost("avatar/external")]
    public async Task<IActionResult> AddExternalAvatar([FromBody] CreateExternalAvatarRequest req, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(req.Url)) return BadRequest("Url không được trống.");
        var uid = GetUserId();

        // tạo Media: nguồn external (demo)
        var media = new Medium
        {
            StorageAccount = "",
            Container = "external",
            BlobPath = $"users/{uid}/{Guid.NewGuid():N}",
            FileName = System.IO.Path.GetFileName(new Uri(req.Url).AbsolutePath),
            ContentType = "image/jpeg", // TODO: đoán theo đuôi hoặc HEAD mime
            ByteSize = 0,
            SourceType = "external",
            ExternalUrl = req.Url.Trim(),
            Status = "imported",
            CreatedAt = DateTime.UtcNow
        };
        _db.Media.Add(media);
        await _db.SaveChangesAsync(ct);

        // gắn UserMedia
        if (req.AsPrimary)
        {
            var existing = _db.UserMedia.Where(x => x.UserId == uid);
            await existing.ForEachAsync(x => x.IsPrimary = false, ct);
        }

        var link = new UserMedium
        {
            UserId = uid,
            MediaId = media.MediaId,
            IsPrimary = req.AsPrimary,
            SortOrder = 0
        };
        _db.UserMedia.Add(link);
        await _db.SaveChangesAsync(ct);

        return Ok(new
        {
            message = "Đã thêm ảnh hồ sơ.",
            mediaId = media.MediaId,
            url = BuildPublicUrl(media, _az.BaseUrl)
        });
    }

    public sealed class SetPrimaryReq { public long MediaId { get; set; } }

    [HttpPost("avatar/set-primary")]
    public async Task<IActionResult> SetPrimary([FromBody] SetPrimaryReq req, CancellationToken ct)
    {
        var uid = GetUserId();
        var link = await _db.UserMedia.FirstOrDefaultAsync(x => x.UserId == uid && x.MediaId == req.MediaId, ct);
        if (link == null) return NotFound("Ảnh không thuộc người dùng này.");

        var all = _db.UserMedia.Where(x => x.UserId == uid);
        await all.ForEachAsync(x => x.IsPrimary = false, ct);
        link.IsPrimary = true;
        await _db.SaveChangesAsync(ct);

        return Ok(new { message = "Đã đặt ảnh làm chính." });
    }

    [HttpDelete("avatar/{mediaId:long}")]
    public async Task<IActionResult> RemoveAvatar([FromRoute] long mediaId, CancellationToken ct)
    {
        var uid = GetUserId();
        var link = await _db.UserMedia.FirstOrDefaultAsync(x => x.UserId == uid && x.MediaId == mediaId, ct);
        if (link == null) return NotFound();

        _db.UserMedia.Remove(link);
        // (tuỳ) có thể xóa luôn Media nếu không còn ai dùng:
        var stillUsed = await _db.UserMedia.AnyAsync(x => x.MediaId == mediaId && x.UserId != uid, ct);
        if (!stillUsed)
        {
            var m = await _db.Media.FirstOrDefaultAsync(x => x.MediaId == mediaId, ct);
            if (m != null) _db.Media.Remove(m);
        }

        await _db.SaveChangesAsync(ct);
        return Ok(new { message = "Đã gỡ ảnh." });
    }

    // ========= ADDRESSES (giữ nguyên) =========

    [HttpPost("addresses")]
    public async Task<IActionResult> AddAddress([FromBody] UpsertAddressRequest req, CancellationToken ct)
    {
        var uid = GetUserId();
        var user = await _db.Users.Include(x => x.Addresses).FirstOrDefaultAsync(x => x.UserId == uid, ct);
        if (user == null) return NotFound();

        var addr = new Address
        {
            UserId = uid,
            FullName = string.IsNullOrWhiteSpace(req.FullName) ? user.FullName : req.FullName!.Trim(),
            Line1 = req.Line1?.Trim(),
            District = req.District?.Trim(),
            City = req.City?.Trim(),
            Country = string.IsNullOrWhiteSpace(req.Country) ? "Vietnam" : req.Country.Trim(),
            PostalCode = req.PostalCode?.Trim(),
            Phone = string.IsNullOrWhiteSpace(req.Phone) ? user.Phone : req.Phone!.Trim(),
            IsDefault = req.IsDefault
        };

        if (req.IsDefault)
        {
            foreach (var a in user.Addresses) a.IsDefault = false;
        }
        else if (!user.Addresses.Any())
        {
            addr.IsDefault = true;
        }

        _db.Addresses.Add(addr);
        await _db.SaveChangesAsync(ct);

        return Ok(new { message = "Thêm địa chỉ thành công.", addressId = addr.AddressId });
    }

    [HttpPut("addresses/{id:int}")]
    public async Task<IActionResult> UpdateAddress([FromRoute] int id, [FromBody] UpsertAddressRequest req, CancellationToken ct)
    {
        var uid = GetUserId();
        var addr = await _db.Addresses.FirstOrDefaultAsync(a => a.AddressId == id && a.UserId == uid, ct);
        if (addr == null) return NotFound();

        if (req.FullName != null) addr.FullName = req.FullName.Trim();
        if (req.Line1 != null) addr.Line1 = req.Line1.Trim();
        if (req.District != null) addr.District = req.District.Trim();
        if (req.City != null) addr.City = req.City.Trim();
        if (req.Country != null) addr.Country = req.Country.Trim();
        if (req.PostalCode != null) addr.PostalCode = req.PostalCode.Trim();
        if (req.Phone != null) addr.Phone = req.Phone.Trim();

        if (req.IsDefault)
        {
            var siblings = _db.Addresses.Where(a => a.UserId == uid && a.AddressId != id);
            await siblings.ForEachAsync(a => a.IsDefault = false, ct);
            addr.IsDefault = true;
        }

        await _db.SaveChangesAsync(ct);
        return Ok(new { message = "Cập nhật địa chỉ thành công." });
    }

    [HttpDelete("addresses/{id:int}")]
    public async Task<IActionResult> DeleteAddress([FromRoute] int id, CancellationToken ct)
    {
        var uid = GetUserId();
        var addr = await _db.Addresses.FirstOrDefaultAsync(a => a.AddressId == id && a.UserId == uid, ct);
        if (addr == null) return NotFound();

        bool wasDefault = addr.IsDefault;
        _db.Addresses.Remove(addr);
        await _db.SaveChangesAsync(ct);

        if (wasDefault)
        {
            var remain = await _db.Addresses
                .Where(a => a.UserId == uid)
                .OrderBy(a => a.AddressId)
                .ToListAsync(ct);

            if (remain.Count > 0 && !remain.Any(a => a.IsDefault))
            {
                remain[0].IsDefault = true;
                await _db.SaveChangesAsync(ct);
            }
        }

        return Ok(new { message = "Xoá địa chỉ thành công." });
    }

    [HttpPost("addresses/{id:int}/set-default")]
    public async Task<IActionResult> SetDefault([FromRoute] int id, CancellationToken ct)
    {
        var uid = GetUserId();
        var all = _db.Addresses.Where(a => a.UserId == uid);
        var target = await all.FirstOrDefaultAsync(a => a.AddressId == id, ct);
        if (target == null) return NotFound();

        await all.ForEachAsync(a => a.IsDefault = false, ct);
        target.IsDefault = true;
        await _db.SaveChangesAsync(ct);

        return Ok(new { message = "Đã đặt địa chỉ mặc định." });
    }

    // ========= UPLOAD AVATAR (demo nhanh) =========
    [HttpPost("avatar/upload")]
    [Consumes("multipart/form-data")]
    [RequestSizeLimit(10_000_000)] // 10MB
    public async Task<IActionResult> UploadAvatar([FromForm] AvatarUploadRequest req, CancellationToken ct)
    {
        var uid = GetUserId();
        if (req.file == null || req.file.Length == 0)
            return BadRequest("Không có file tải lên.");

        // 0) Validate mime/type
        var allowed = new[] { "image/png", "image/jpeg", "image/webp" };
        var mime = (req.file.ContentType ?? "").ToLowerInvariant();
        if (!allowed.Contains(mime)) return BadRequest("Định dạng ảnh không hỗ trợ (chỉ png, jpg/jpeg, webp).");

        // (tuỳ chọn) chặn file quá lớn nếu muốn chặt chẽ hơn server-side
        if (req.file.Length > 10 * 1024 * 1024)
            return BadRequest("Ảnh vượt quá 10MB.");

        // 1) Upload lên Azure Blob
        await using var s = req.file.OpenReadStream();
        var uploadedUrl = await _storage.UploadAsync(s, mime, req.file.FileName, ct); // URL public hoặc SAS

        // Trích blobName từ URL trả về (ổn với cả SAS vì lấy từ AbsolutePath)
        var blobName = Path.GetFileName(new Uri(uploadedUrl).AbsolutePath);

        // 2) Lấy avatar hiện tại (nếu có) để dọn rác sau khi thay
        var oldPrimaryLink = await _db.UserMedia
            .AsNoTracking()
            .Where(x => x.UserId == uid && x.IsPrimary)
            .Include(x => x.Media)
            .FirstOrDefaultAsync(ct);

        // 3) Lưu Media mới
        var medium = new Medium
        {
            StorageAccount = "",
            Container = _az.Container ?? "avatars",
            BlobPath = blobName,
            FileName = req.file.FileName,
            ContentType = mime,
            ByteSize = req.file.Length,
            SourceType = "blob",
            ExternalUrl = null,              // <== QUAN TRỌNG: không lưu SAS
            Status = "imported",
            CreatedAt = DateTime.UtcNow
        };
        _db.Media.Add(medium);
        await _db.SaveChangesAsync(ct);

        // 4) Gắn làm avatar chính (clear cờ IsPrimary cũ)
        var links = _db.UserMedia.Where(x => x.UserId == uid);
        await links.ForEachAsync(x => x.IsPrimary = false, ct);

        _db.UserMedia.Add(new UserMedium
        {
            UserId = uid,
            MediaId = medium.MediaId,
            IsPrimary = true,
            SortOrder = 0
        });
        await _db.SaveChangesAsync(ct);

        // 5) (Tối ưu) Dọn blob cũ nếu không còn ai dùng
        if (oldPrimaryLink?.Media != null)
        {
            var oldMedia = oldPrimaryLink.Media;
            var stillUsed = await _db.UserMedia.AnyAsync(x => x.MediaId == oldMedia.MediaId, ct);
            if (!stillUsed && !string.IsNullOrWhiteSpace(oldMedia.BlobPath))
            {
                // best-effort: lỗi xoá blob không làm fail request
                try { await _storage.DeleteAsync(oldMedia.BlobPath, ct); } catch { /* ignore */ }

                _db.Attach(oldMedia);
                _db.Media.Remove(oldMedia);
                await _db.SaveChangesAsync(ct);
            }
        }

        // 6) Trả về SAS URL 10 phút thay vì public URL
        string url;
        try
        {
            if (_storage is BlobAvatarStorage blobSvc)
                url = blobSvc.GenerateReadSasUrl(medium.BlobPath, 10);
            else
                url = $"{(_az.BaseUrl ?? "").TrimEnd('/')}/{medium.BlobPath}";
        }
        catch
        {
            url = $"{(_az.BaseUrl ?? "").TrimEnd('/')}/{medium.BlobPath}";
        }

        return Ok(new { message = "Upload avatar thành công.", mediaId = medium.MediaId, url });
    }
}
