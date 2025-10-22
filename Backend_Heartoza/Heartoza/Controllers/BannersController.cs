using Heartoza.Models;
using Heartoza.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using System.ComponentModel.DataAnnotations;

[ApiController]
[Route("api/[controller]")]
public class BannersController : ControllerBase
{
    private readonly GiftBoxShopContext _db;
    private readonly IAvatarStorage _storage;
    private readonly AzureStorageOptions _az;

    public BannersController(GiftBoxShopContext db, IAvatarStorage storage, IOptions<AzureStorageOptions> az)
    {
        _db = db; _storage = storage; _az = az.Value;
    }

    private string BuildImageUrl(string? blobPathOrNull, int minutes = 10)
    {
        if (string.IsNullOrWhiteSpace(blobPathOrNull)) return string.Empty;
        try
        {
            if (_storage is BlobAvatarStorage blobSvc) // giống mô-típ BuildImageUrl đang dùng
                return blobSvc.GenerateReadSasUrl(blobPathOrNull, minutes);
        }
        catch { /* ignore */ }
        return $"{(_az.BaseUrl ?? "").TrimEnd('/')}/{blobPathOrNull}".Replace("//", "/");
    }

    // ======== PUBLIC: Lấy banner đang hiệu lực theo vị trí ========
    // GET /api/banners/active?position=home-top
    [HttpGet("active")]
    [AllowAnonymous]
    public async Task<IActionResult> GetActive([FromQuery] string position, CancellationToken ct)
    {
        var now = DateTime.UtcNow;
        var q = _db.Banners.AsNoTracking()
            .Where(b => b.IsActive == true
                        && b.Position == position
                        && (b.StartAt == null || b.StartAt <= now)
                        && (b.EndAt == null || b.EndAt > now))
            .OrderBy(b => b.SortOrder);

        // Resolve ảnh: ưu tiên MediaId -> lấy Media.BlobPath -> SAS, fallback ExternalImageUrl
        var items = await q
            .Select(b => new
            {
                b.BannerId,
                b.Title,
                b.LinkUrl,
                b.OpenInNewTab,
                b.Position,
                b.SortOrder,
                MediaBlobPath = b.MediaId != null
                    ? _db.Media.Where(m => m.MediaId == b.MediaId).Select(m => m.BlobPath).FirstOrDefault()
                    : null,
                b.ExternalImageUrl
            }).ToListAsync(ct);

        var result = items.Select(x => new
        {
            x.BannerId,
            x.Title,
            x.LinkUrl,
            x.OpenInNewTab,
            x.Position,
            x.SortOrder,
            ImageUrl = !string.IsNullOrWhiteSpace(x.MediaBlobPath)
                ? BuildImageUrl(x.MediaBlobPath, 10) // SAS 10'
                : (x.ExternalImageUrl ?? "")
        });

        return Ok(result);
    }

    // ======== ADMIN CRUD ========
    // GET /api/banners (paging + filter position)
    [HttpGet]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> List([FromQuery] string? position, [FromQuery] int page = 1, [FromQuery] int pageSize = 20, CancellationToken ct = default)
    {
        if (page <= 0) page = 1; if (pageSize <= 0 || pageSize > 100) pageSize = 20;
        var q = _db.Banners.AsNoTracking().AsQueryable();
        if (!string.IsNullOrWhiteSpace(position)) q = q.Where(b => b.Position == position);

        var total = await q.CountAsync(ct);
        var items = await q.OrderBy(b => b.Position).ThenBy(b => b.SortOrder)
            .Skip((page - 1) * pageSize).Take(pageSize)
            .Select(b => new {
                b.BannerId,
                b.Title,
                b.Position,
                b.SortOrder,
                b.IsActive,
                b.StartAt,
                b.EndAt,
                b.MediaId,
                b.ExternalImageUrl,
                b.LinkUrl,
                b.OpenInNewTab,
                b.CreatedAt
            })
            .ToListAsync(ct);

        return Ok(new { page, pageSize, total, items });
    }

    public sealed class BannerUpsertDto
    {
        public string? Title { get; set; }
        public long? MediaId { get; set; }           // nếu dùng ảnh trong Media
        public string? ExternalImageUrl { get; set; }// hoặc dán URL ngoài
        public string Position { get; set; } = "home-top";
        public int SortOrder { get; set; } = 0;
        public string? LinkUrl { get; set; }
        public bool OpenInNewTab { get; set; } = true;
        public bool IsActive { get; set; } = true;
        public DateTime? StartAt { get; set; }
        public DateTime? EndAt { get; set; }
    }

    // POST /api/banners
    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Create([FromBody] BannerUpsertDto req, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(req.Position)) return BadRequest("Position không được để trống.");

        var e = new Banner
        {
            Title = req.Title?.Trim(),
            MediaId = req.MediaId,
            ExternalImageUrl = req.ExternalImageUrl,
            Position = req.Position.Trim(),
            SortOrder = req.SortOrder,
            LinkUrl = req.LinkUrl,
            OpenInNewTab = req.OpenInNewTab,
            IsActive = req.IsActive,
            StartAt = req.StartAt,
            EndAt = req.EndAt,
            CreatedAt = DateTime.UtcNow
        };
        _db.Banners.Add(e);
        await _db.SaveChangesAsync(ct);
        return CreatedAtAction(nameof(GetById), new { id = e.BannerId }, e);
    }

    // GET /api/banners/{id}
    [HttpGet("{id:int}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> GetById(int id, CancellationToken ct)
    {
        var b = await _db.Banners.AsNoTracking().FirstOrDefaultAsync(x => x.BannerId == id, ct);
        return b is null ? NotFound() : Ok(b);
    }

    // PUT /api/banners/{id}
    [HttpPut("{id:int}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Update(int id, [FromBody] BannerUpsertDto req, CancellationToken ct)
    {
        var e = await _db.Banners.FirstOrDefaultAsync(x => x.BannerId == id, ct);
        if (e == null) return NotFound();

        if (!string.IsNullOrWhiteSpace(req.Position)) e.Position = req.Position.Trim();
        e.Title = req.Title?.Trim();
        e.MediaId = req.MediaId;
        e.ExternalImageUrl = req.ExternalImageUrl;
        e.SortOrder = req.SortOrder;
        e.LinkUrl = req.LinkUrl;
        e.OpenInNewTab = req.OpenInNewTab;
        e.IsActive = req.IsActive;
        e.StartAt = req.StartAt;
        e.EndAt = req.EndAt;

        await _db.SaveChangesAsync(ct);
        return Ok(e);
    }

    // DELETE /api/banners/{id}
    [HttpDelete("{id:int}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(int id, CancellationToken ct)
    {
        var e = await _db.Banners.FirstOrDefaultAsync(x => x.BannerId == id, ct);
        if (e == null) return NotFound();
        _db.Banners.Remove(e);
        await _db.SaveChangesAsync(ct);
        return Ok(new { message = "Đã xóa banner.", id });
    }
    public class BannerUploadRequest
    {
        [Required]
        public IFormFile file { get; set; } = default!;
        // Optional: nếu muốn thay ảnh cho 1 banner có sẵn, truyền id vào -> controller sẽ set MediaId luôn
        public int? bannerId { get; set; }
    }

    [HttpPost("upload")]
    [Authorize(Roles = "Admin")]
    [Consumes("multipart/form-data")]
    [RequestSizeLimit(10_000_000)] // 10MB
    public async Task<IActionResult> UploadBanner([FromForm] BannerUploadRequest req, CancellationToken ct)
    {
        if (req.file == null || req.file.Length == 0)
            return BadRequest(new { message = "Không có file tải lên." });

        var allowed = new[] { "image/png", "image/jpeg", "image/webp", "image/jpg" };
        var mime = (req.file.ContentType ?? "").ToLowerInvariant();
        if (!allowed.Contains(mime))
            return BadRequest(new { message = "Định dạng ảnh không hỗ trợ (png, jpg/jpeg, webp)." });

        if (req.file.Length > 10 * 1024 * 1024)
            return BadRequest(new { message = "Ảnh vượt quá 10MB." });

        // 1) Upload lên storage
        await using var s = req.file.OpenReadStream();
        var uploadedUrl = await _storage.UploadAsync(s, mime, req.file.FileName, ct);
        var blobName = Path.GetFileName(new Uri(uploadedUrl).AbsolutePath);

        // 2) Tạo record Media (giống avatar)
        var medium = new Medium
        {
            StorageAccount = "",
            Container = _az.Container ?? "banners", // gợi ý dùng container 'banners'
            BlobPath = blobName,
            FileName = req.file.FileName,
            ContentType = mime,
            ByteSize = req.file.Length,
            SourceType = "blob",
            ExternalUrl = null,
            Status = "imported",
            CreatedAt = DateTime.UtcNow
        };
        _db.Media.Add(medium);
        await _db.SaveChangesAsync(ct);

        // 3) Nếu có bannerId -> gắn ảnh này làm ảnh banner
        long? oldMediaId = null;
        if (req.bannerId.HasValue)
        {
            var banner = await _db.Banners.FirstOrDefaultAsync(b => b.BannerId == req.bannerId.Value, ct);
            if (banner == null) return NotFound(new { message = "Banner không tồn tại." });

            oldMediaId = banner.MediaId;
            banner.MediaId = medium.MediaId;
            banner.ExternalImageUrl = null; // ưu tiên ảnh blob
            await _db.SaveChangesAsync(ct);
        }

        // 4) Nếu có ảnh cũ và không còn ai tham chiếu -> xoá (dọn rác)
        if (oldMediaId.HasValue)
        {
            var stillUsed = await _db.Banners.AnyAsync(b => b.MediaId == oldMediaId.Value, ct);
            if (!stillUsed)
            {
                var oldMedia = await _db.Media.FirstOrDefaultAsync(m => m.MediaId == oldMediaId.Value, ct);
                if (oldMedia != null && !string.IsNullOrWhiteSpace(oldMedia.BlobPath))
                {
                    try { await _storage.DeleteAsync(oldMedia.BlobPath, ct); } catch { /* ignore */ }
                    _db.Media.Remove(oldMedia);
                    await _db.SaveChangesAsync(ct);
                }
            }
        }

        // 5) Generate tạm URL đọc được (nếu có SAS)
        string url;
        try
        {
            if (_storage is BlobAvatarStorage blobSvc)
                url = blobSvc.GenerateReadSasUrl(medium.BlobPath, 10); // 10 phút
            else
                url = $"{(_az.BaseUrl ?? "").TrimEnd('/')}/{medium.BlobPath}";
        }
        catch
        {
            url = $"{(_az.BaseUrl ?? "").TrimEnd('/')}/{medium.BlobPath}";
        }

        return Ok(new
        {
            message = "Upload banner thành công.",
            mediaId = medium.MediaId,
            url
        });
    }
}
