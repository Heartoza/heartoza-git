using Heartoza.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

[ApiController]
[Route("api/[controller]")]
public class SeoController : ControllerBase
{
    private readonly GiftBoxShopContext _db;
    public SeoController(GiftBoxShopContext db) => _db = db;

    // ======== PUBLIC: GET meta theo slug ========
    // GET /api/seo/meta?slug=/collections/noel
    [HttpGet("meta")]
    [AllowAnonymous]
    public async Task<IActionResult> GetMeta([FromQuery] string slug, CancellationToken ct)
    {
        slug = Normalize(slug);
        if (string.IsNullOrEmpty(slug)) return NotFound();

        var row = await _db.SeoMeta.AsNoTracking()
            .Where(s => s.Slug == slug)
            .Select(s => new
            {
                s.Slug,
                s.Title,
                s.Description,
                s.Keywords,
                s.CanonicalUrl,
                s.NoIndex,
                s.NoFollow,
                OgImageBlob = s.ImageMediaId != null
                    ? _db.Media.Where(m => m.MediaId == s.ImageMediaId).Select(m => m.BlobPath).FirstOrDefault()
                    : null,
                s.OgImageUrl
            })
            .FirstOrDefaultAsync(ct);

        if (row == null) return NotFound();

        // trả đúng og:image: ưu tiên blob (FE có thể dùng trực tiếp nếu public; hoặc BE có endpoint cấp SAS riêng)
        var ogImage = !string.IsNullOrWhiteSpace(row.OgImageBlob) ? row.OgImageBlob : row.OgImageUrl;

        return Ok(new
        {
            row.Slug,
            row.Title,
            row.Description,
            row.Keywords,
            row.CanonicalUrl,
            row.NoIndex,
            row.NoFollow,
            OgImage = ogImage
        });
    }

    private static string Normalize(string? s)
    {
        var t = (s ?? "").Trim();
        if (t == "") return "/";
        // Chuẩn hóa: luôn bắt đầu bằng '/'
        if (!t.StartsWith("/")) t = "/" + t;
        // Bỏ dấu '/' cuối (trừ khi chỉ là "/")
        if (t.Length > 1 && t.EndsWith("/")) t = t.TrimEnd('/');
        return t;
    }

    // ======== ADMIN CRUD ========
    [HttpGet]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> List([FromQuery] string? q, [FromQuery] int page = 1, [FromQuery] int pageSize = 20, CancellationToken ct = default)
    {
        if (page <= 0) page = 1; if (pageSize <= 0 || pageSize > 100) pageSize = 20;
        var query = _db.SeoMeta.AsNoTracking().AsQueryable();
        if (!string.IsNullOrWhiteSpace(q))
        {
            var pattern = $"%{q.Trim()}%";
            query = query.Where(s => EF.Functions.Like(s.Slug, pattern) || EF.Functions.Like(s.Title, pattern));
        }
        var total = await query.CountAsync(ct);
        var items = await query.OrderBy(s => s.Slug)
            .Skip((page - 1) * pageSize).Take(pageSize)
            .ToListAsync(ct);

        return Ok(new { page, pageSize, total, items });
    }

    public sealed class SeoUpsertDto
    {
        public string Slug { get; set; } = default!;
        public string? Title { get; set; }
        public string? Description { get; set; }
        public string? Keywords { get; set; }
        public long? ImageMediaId { get; set; }
        public string? OgImageUrl { get; set; }
        public string? CanonicalUrl { get; set; }
        public bool NoIndex { get; set; }
        public bool NoFollow { get; set; }
    }

    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Create([FromBody] SeoUpsertDto req, CancellationToken ct)
    {
        var slug = Normalize(req.Slug);
        if (string.IsNullOrEmpty(slug)) return BadRequest("Slug không hợp lệ.");
        if (await _db.SeoMeta.AnyAsync(s => s.Slug == slug, ct)) return Conflict("Slug đã tồn tại.");

        var e = new SeoMetum
        {
            Slug = slug,
            Title = req.Title?.Trim(),
            Description = req.Description?.Trim(),
            Keywords = req.Keywords?.Trim(),
            ImageMediaId = req.ImageMediaId,
            OgImageUrl = req.OgImageUrl,
            CanonicalUrl = req.CanonicalUrl,
            NoIndex = req.NoIndex,
            NoFollow = req.NoFollow,
            CreatedAt = DateTime.UtcNow
        };
        _db.SeoMeta.Add(e);
        await _db.SaveChangesAsync(ct);
        return CreatedAtAction(nameof(GetById), new { id = e.SeoMetaId }, e);
    }

    [HttpGet("{id:int}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> GetById(int id, CancellationToken ct)
    {
        var e = await _db.SeoMeta.AsNoTracking().FirstOrDefaultAsync(x => x.SeoMetaId == id, ct);
        return e is null ? NotFound() : Ok(e);
    }

    [HttpPut("{id:int}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Update(int id, [FromBody] SeoUpsertDto req, CancellationToken ct)
    {
        var e = await _db.SeoMeta.FirstOrDefaultAsync(x => x.SeoMetaId == id, ct);
        if (e == null) return NotFound();

        var slug = Normalize(req.Slug);
        if (string.IsNullOrEmpty(slug)) return BadRequest("Slug không hợp lệ.");

        var dup = await _db.SeoMeta.AnyAsync(x => x.Slug == slug && x.SeoMetaId != id, ct);
        if (dup) return Conflict("Slug đã tồn tại.");

        e.Slug = slug;
        e.Title = req.Title?.Trim();
        e.Description = req.Description?.Trim();
        e.Keywords = req.Keywords?.Trim();
        e.ImageMediaId = req.ImageMediaId;
        e.OgImageUrl = req.OgImageUrl;
        e.CanonicalUrl = req.CanonicalUrl;
        e.NoIndex = req.NoIndex;
        e.NoFollow = req.NoFollow;
        e.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync(ct);
        return Ok(e);
    }

    [HttpDelete("{id:int}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(int id, CancellationToken ct)
    {
        var e = await _db.SeoMeta.FirstOrDefaultAsync(x => x.SeoMetaId == id, ct);
        if (e == null) return NotFound();
        _db.SeoMeta.Remove(e);
        await _db.SaveChangesAsync(ct);
        return Ok(new { message = "Đã xóa SEO meta.", id });
    }
}
