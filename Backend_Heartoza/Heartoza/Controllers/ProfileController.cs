using BCrypt.Net;
using Heartoza.DTO.Profile;
using Heartoza.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ProfileController : ControllerBase
{
    private readonly GiftBoxShopContext _db;
    public ProfileController(GiftBoxShopContext db) => _db = db;

    private int GetUserId() => int.Parse(
        User.FindFirstValue(ClaimTypes.NameIdentifier)
        ?? User.FindFirstValue(ClaimTypes.Name)
        ?? User.FindFirstValue("sub")!
    );

    // ========= PROFILE =========

    [HttpGet("me")]
    public async Task<IActionResult> Me(CancellationToken ct)
    {
        var uid = GetUserId();

        var u = await _db.Users
            .AsNoTracking()
            .Where(x => x.UserId == uid)
            .Select(x => new ProfileResponse
            {
                UserId = x.UserId,
                FullName = x.FullName ?? "",
                Email = x.Email,
                Phone = x.Phone,
                Role = x.Role ?? "Customer",
                IsActive = x.IsActive,
                CreatedAt = x.CreatedAt,
                AvatarUrl = x.AvatarUrl,
                LastLoginAt = x.LastLoginAt,

                Addresses = x.Addresses.Select(a => new AddressResponse
                {
                    AddressId = a.AddressId,
                    FullName = a.FullName,
                    Line1 = a.Line1,
                    District = a.District,
                    City = a.City,
                    Country = a.Country,
                    PostalCode = a.PostalCode,
                    Phone = a.Phone,
                    IsDefault = a.IsDefault
                })
                .OrderByDescending(a => a.IsDefault)
                .ThenBy(a => a.AddressId)
                .ToList(),

                DefaultAddressId = x.Addresses
                    .Where(a => a.IsDefault)
                    .Select(a => (int?)a.AddressId)
                    .FirstOrDefault()
            })
            .FirstOrDefaultAsync(ct);

        return u == null ? NotFound() : Ok(u);
    }

    [HttpPut("me")]
    public async Task<IActionResult> UpdateMe([FromBody] UpdateProfileRequest req, CancellationToken ct)
    {
        var uid = GetUserId();
        var u = await _db.Users.FirstOrDefaultAsync(x => x.UserId == uid, ct);
        if (u == null) return NotFound();

        if (!string.IsNullOrWhiteSpace(req.FullName)) u.FullName = req.FullName.Trim();
        if (!string.IsNullOrWhiteSpace(req.Phone)) u.Phone = req.Phone.Trim();
        if (!string.IsNullOrWhiteSpace(req.AvatarUrl)) u.AvatarUrl = req.AvatarUrl.Trim();

        await _db.SaveChangesAsync(ct);
        return Ok(new { message = "Cập nhật hồ sơ thành công." });
    }

    [HttpPost("change-password")]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequest req, CancellationToken ct)
    {
        var uid = GetUserId();
        var u = await _db.Users.FirstOrDefaultAsync(x => x.UserId == uid, ct);
        if (u == null) return NotFound();

        if (!BCrypt.Net.BCrypt.Verify(req.CurrentPassword, u.PasswordHash))
            return BadRequest("Mật khẩu hiện tại không đúng.");

        // rule nhẹ: >=8, có chữ & số
        if (req.NewPassword.Length < 8 || !req.NewPassword.Any(char.IsLetter) || !req.NewPassword.Any(char.IsDigit))
            return BadRequest("Mật khẩu mới tối thiểu 8 ký tự, gồm cả chữ và số.");

        u.PasswordHash = BCrypt.Net.BCrypt.HashPassword(req.NewPassword);
        await _db.SaveChangesAsync(ct);
        return Ok(new { message = "Đổi mật khẩu thành công." });
    }

    // ========= ADDRESSES =========

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
            addr.IsDefault = true; // địa chỉ đầu tiên -> mặc định
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
}
