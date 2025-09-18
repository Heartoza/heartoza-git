using BCrypt.Net;
using Heartoza.DTO.Auth;
using Heartoza.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly GiftBoxShopContext _db;
    private readonly ITokenService _token;
    public AuthController(GiftBoxShopContext db, ITokenService token) { _db = db; _token = token; }

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterRequest req, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(req.Email) || string.IsNullOrWhiteSpace(req.Password))
            return BadRequest("Email và mật khẩu là bắt buộc.");

        var exists = await _db.Users.AnyAsync(u => u.Email == req.Email, ct);
        if (exists) return BadRequest("Email đã tồn tại.");

        var user = new User
        {
            FullName = req.FullName?.Trim(),
            Email = req.Email.Trim(),
            Phone = req.Phone,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(req.Password),
            Role = "Customer",
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };
        _db.Users.Add(user);
        await _db.SaveChangesAsync(ct);

        var token = _token.CreateToken(user.UserId, user.Email, user.Role ?? "Customer");
        return Ok(new AuthResponse
        {
            Token = token,
            UserId = user.UserId,
            Email = user.Email,
            FullName = user.FullName ?? "",
            Role = user.Role ?? "Customer"
        });
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest req, CancellationToken ct)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Email == req.Email, ct);
        if (user == null || !(user.IsActive ?? false))
            return Unauthorized("Sai thông tin đăng nhập.");

        if (!BCrypt.Net.BCrypt.Verify(req.Password, user.PasswordHash))
            return Unauthorized("Sai thông tin đăng nhập.");

        var token = _token.CreateToken(user.UserId, user.Email, user.Role ?? "Customer");
        return Ok(new AuthResponse
        {
            Token = token,
            UserId = user.UserId,
            Email = user.Email,
            FullName = user.FullName ?? "",
            Role = user.Role ?? "Customer"
        });
    }

    // Dev-mode: trả token reset ra response để FE test (chưa gửi email)
    [HttpPost("forgot")]
    public async Task<IActionResult> Forgot([FromBody] ForgotPasswordRequest req, CancellationToken ct)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Email == req.Email, ct);
        if (user == null) return Ok(new { message = "Nếu email hợp lệ, chúng tôi đã gửi hướng dẫn đặt lại." });

        var token = Guid.NewGuid().ToString("N");
        var reset = new PasswordReset
        {
            UserId = user.UserId,
            Token = token,
            ExpiresAt = DateTime.UtcNow.AddMinutes(30)
        };
        _db.PasswordResets.Add(reset);
        await _db.SaveChangesAsync(ct);

        // TODO: gửi email kèm token. Tạm thời trả về để FE test.
        return Ok(new { message = "Đã tạo yêu cầu đặt lại mật khẩu.", token });
    }

    [HttpPost("reset")]
    public async Task<IActionResult> Reset([FromBody] ResetPasswordRequest req, CancellationToken ct)
    {
        var pr = await _db.PasswordResets
            .Include(x => x.User)
            .FirstOrDefaultAsync(x => x.Token == req.Token, ct);

        if (pr == null || pr.UsedAt != null || pr.ExpiresAt < DateTime.UtcNow)
            return BadRequest("Token không hợp lệ hoặc đã hết hạn.");

        pr.User.PasswordHash = BCrypt.Net.BCrypt.HashPassword(req.NewPassword);
        pr.UsedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync(ct);
        return Ok(new { message = "Đổi mật khẩu thành công." });
    }
}
