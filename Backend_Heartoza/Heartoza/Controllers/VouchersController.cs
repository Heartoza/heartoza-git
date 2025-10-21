using Heartoza.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

[ApiController]
[Route("api/[controller]")]
public class VouchersController : ControllerBase
{
    private readonly GiftBoxShopContext _db;
    public VouchersController(GiftBoxShopContext db) => _db = db;

    // ======== PUBLIC: validate / quote áp dụng voucher ========
    public sealed class VoucherValidateRequest
    {
        public string Code { get; set; } = default!;
        public decimal OrderSubtotal { get; set; } // tiền hàng trước ship
        public int? UserId { get; set; }           // nếu có đăng nhập
    }
    public sealed class VoucherValidateResponse
    {
        public bool Valid { get; set; }
        public string? Reason { get; set; }
        public decimal? Discount { get; set; } // số tiền giảm thực tế
        public string? DiscountType { get; set; }
        public decimal? DiscountValue { get; set; }
        public decimal? MaxDiscount { get; set; }
    }

    // POST /api/vouchers/validate
    [HttpPost("validate")]
    [AllowAnonymous]
    public async Task<IActionResult> Validate([FromBody] VoucherValidateRequest req, CancellationToken ct)
    {
        var code = (req.Code ?? "").Trim().ToUpperInvariant();
        if (string.IsNullOrEmpty(code)) return Ok(new VoucherValidateResponse { Valid = false, Reason = "Thiếu mã." });

        var now = DateTime.UtcNow;
        var v = await _db.Vouchers.AsNoTracking().FirstOrDefaultAsync(x =>
            x.Code == code && x.IsActive == true
            && (x.StartAt == null || x.StartAt <= now)
            && (x.EndAt == null || x.EndAt > now), ct);

        if (v == null) return Ok(new VoucherValidateResponse { Valid = false, Reason = "Mã không hợp lệ/hết hạn." });

        // Check usage limits
        if (v.UsageLimit.HasValue && v.UsageCount >= v.UsageLimit.Value)
            return Ok(new VoucherValidateResponse { Valid = false, Reason = "Mã đã hết lượt dùng." });

        if (req.UserId.HasValue && v.PerUserLimit.HasValue)
        {
            var usedByUser = await _db.VoucherUsages.CountAsync(u => u.VoucherId == v.VoucherId && u.UserId == req.UserId, ct);
            if (usedByUser >= v.PerUserLimit.Value)
                return Ok(new VoucherValidateResponse { Valid = false, Reason = "Bạn đã dùng tối đa số lượt cho mã này." });
        }

        // Min order
        if (v.MinOrder.HasValue && req.OrderSubtotal < v.MinOrder.Value)
            return Ok(new VoucherValidateResponse { Valid = false, Reason = $"Đơn tối thiểu {v.MinOrder.Value:0,0}đ." });

        // Compute discount amount
        decimal discount = 0m;
        if (string.Equals(v.DiscountType, "percent", StringComparison.OrdinalIgnoreCase))
        {
            discount = Math.Round(req.OrderSubtotal * (v.DiscountValue / 100m), 0, MidpointRounding.AwayFromZero);
            if (v.MaxDiscount.HasValue) discount = Math.Min(discount, v.MaxDiscount.Value);
        }
        else // amount
        {
            discount = v.DiscountValue;
            if (discount > req.OrderSubtotal) discount = req.OrderSubtotal;
        }

        return Ok(new VoucherValidateResponse
        {
            Valid = discount > 0,
            Reason = discount > 0 ? null : "Mã không mang lại giảm giá.",
            Discount = discount,
            DiscountType = v.DiscountType,
            DiscountValue = v.DiscountValue,
            MaxDiscount = v.MaxDiscount
        });
    }

    public sealed class VoucherApplyRequest
    {
        public string Code { get; set; } = default!;
        public int? UserId { get; set; }
        public int? OrderId { get; set; } // nếu muốn log kèm
        public decimal OrderSubtotal { get; set; }
    }

    // POST /api/vouchers/apply  (ghi log usage + tăng UsageCount)
    [HttpPost("apply")]
    [Authorize] // yêu cầu đăng nhập để trace user
    public async Task<IActionResult> Apply([FromBody] VoucherApplyRequest req, CancellationToken ct)
    {
        // Reuse validate logic trước khi commit
        var validateRes = (await Validate(new VoucherValidateRequest
        {
            Code = req.Code,
            OrderSubtotal = req.OrderSubtotal,
            UserId = req.UserId
        }, ct) as OkObjectResult)?.Value as VoucherValidateResponse;

        if (validateRes == null || !validateRes.Valid)
            return BadRequest(new { message = validateRes?.Reason ?? "Voucher không hợp lệ." });

        // Transaction nhẹ để tăng UsageCount + ghi VoucherUsages
        var v = await _db.Vouchers.FirstOrDefaultAsync(x => x.Code == req.Code.Trim().ToUpper(), ct);
        if (v == null) return BadRequest("Voucher không tồn tại.");

        v.UsageCount += 1;
        _db.VoucherUsages.Add(new VoucherUsage
        {
            VoucherId = v.VoucherId,
            UserId = req.UserId,
            OrderId = req.OrderId,
            DiscountApplied = validateRes.Discount ?? 0,
            UsedAt = DateTime.UtcNow
        });
        await _db.SaveChangesAsync(ct);

        return Ok(new { message = "Applied", discount = validateRes.Discount, voucherId = v.VoucherId });
    }

    // ======== ADMIN CRUD ========
    [HttpGet]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> List([FromQuery] string? q, [FromQuery] int page = 1, [FromQuery] int pageSize = 20, CancellationToken ct = default)
    {
        if (page <= 0) page = 1; if (pageSize <= 0 || pageSize > 100) pageSize = 20;
        var query = _db.Vouchers.AsNoTracking().AsQueryable();
        if (!string.IsNullOrWhiteSpace(q))
        {
            var pattern = $"%{q.Trim()}%";
            query = query.Where(v => EF.Functions.Like(v.Code, pattern) || EF.Functions.Like(v.Name, pattern));
        }

        var total = await query.CountAsync(ct);
        var items = await query.OrderByDescending(v => v.CreatedAt)
            .Skip((page - 1) * pageSize).Take(pageSize)
            .ToListAsync(ct);

        return Ok(new { page, pageSize, total, items });
    }

    public sealed class VoucherUpsertDto
    {
        public string Code { get; set; } = default!;
        public string? Name { get; set; }
        public string DiscountType { get; set; } = "percent"; // 'percent' | 'amount'
        public decimal DiscountValue { get; set; }
        public decimal? MaxDiscount { get; set; }
        public decimal? MinOrder { get; set; }
        public DateTime? StartAt { get; set; }
        public DateTime? EndAt { get; set; }
        public bool IsActive { get; set; } = true;
        public int? UsageLimit { get; set; }
        public int? PerUserLimit { get; set; }
    }

    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Create([FromBody] VoucherUpsertDto req, CancellationToken ct)
    {
        var code = (req.Code ?? "").Trim().ToUpperInvariant();
        if (string.IsNullOrEmpty(code)) return BadRequest("Code không được trống.");
        if (await _db.Vouchers.AnyAsync(v => v.Code == code, ct)) return Conflict("Code đã tồn tại.");

        var v = new Voucher
        {
            Code = code,
            Name = req.Name?.Trim(),
            DiscountType = req.DiscountType,
            DiscountValue = req.DiscountValue,
            MaxDiscount = req.MaxDiscount,
            MinOrder = req.MinOrder,
            StartAt = req.StartAt,
            EndAt = req.EndAt,
            IsActive = req.IsActive,
            UsageLimit = req.UsageLimit,
            PerUserLimit = req.PerUserLimit,
            UsageCount = 0,
            CreatedAt = DateTime.UtcNow
        };
        _db.Vouchers.Add(v);
        await _db.SaveChangesAsync(ct);
        return CreatedAtAction(nameof(GetById), new { id = v.VoucherId }, v);
    }

    [HttpGet("{id:int}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> GetById(int id, CancellationToken ct)
    {
        var v = await _db.Vouchers.AsNoTracking().FirstOrDefaultAsync(x => x.VoucherId == id, ct);
        return v is null ? NotFound() : Ok(v);
    }

    [HttpPut("{id:int}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Update(int id, [FromBody] VoucherUpsertDto req, CancellationToken ct)
    {
        var v = await _db.Vouchers.FirstOrDefaultAsync(x => x.VoucherId == id, ct);
        if (v == null) return NotFound();

        var newCode = (req.Code ?? "").Trim().ToUpperInvariant();
        if (string.IsNullOrEmpty(newCode)) return BadRequest("Code không được trống.");
        var dup = await _db.Vouchers.AnyAsync(x => x.Code == newCode && x.VoucherId != id, ct);
        if (dup) return Conflict("Code đã tồn tại.");

        v.Code = newCode;
        v.Name = req.Name?.Trim();
        v.DiscountType = req.DiscountType;
        v.DiscountValue = req.DiscountValue;
        v.MaxDiscount = req.MaxDiscount;
        v.MinOrder = req.MinOrder;
        v.StartAt = req.StartAt;
        v.EndAt = req.EndAt;
        v.IsActive = req.IsActive;
        v.UsageLimit = req.UsageLimit;
        v.PerUserLimit = req.PerUserLimit;

        await _db.SaveChangesAsync(ct);
        return Ok(v);
    }

    [HttpDelete("{id:int}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(int id, CancellationToken ct)
    {
        var v = await _db.Vouchers.FirstOrDefaultAsync(x => x.VoucherId == id, ct);
        if (v == null) return NotFound();
        _db.Vouchers.Remove(v);
        await _db.SaveChangesAsync(ct);
        return Ok(new { message = "Đã xóa voucher.", id });
    }
}
