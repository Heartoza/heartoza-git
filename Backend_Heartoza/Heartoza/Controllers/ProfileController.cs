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

    private int GetUserId() => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)
                               ?? User.FindFirstValue(ClaimTypes.Name)
                               ?? User.FindFirstValue("sub")!);

    [HttpGet("me")]
    public async Task<IActionResult> Me(CancellationToken ct)
    {
        var uid = GetUserId();
        var u = await _db.Users.AsNoTracking()
            .Where(x => x.UserId == uid)
            .Select(x => new ProfileResponse
            {
                UserId = x.UserId,
                FullName = x.FullName ?? "",
                Email = x.Email,
                Phone = x.Phone,
                Role = x.Role ?? "Customer",
                IsActive = x.IsActive,
                CreatedAt = x.CreatedAt
            }).FirstOrDefaultAsync(ct);

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

        u.PasswordHash = BCrypt.Net.BCrypt.HashPassword(req.NewPassword);
        await _db.SaveChangesAsync(ct);

        return Ok(new { message = "Đổi mật khẩu thành công." });
    }
}
