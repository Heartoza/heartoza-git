using System.Security.Claims;
using System.Security.Cryptography;
using Heartoza.DTO.Auth;
using Heartoza.Models;
using Heartoza.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly GiftBoxShopContext _db;
    private readonly IJwtService _jwt;
    private readonly IEmailSender _mail;
    private readonly IAuditService _audit;
    private readonly IConfiguration _cfg;

    // Config constants
    private const int MAX_FAILS = 5;
    private static readonly TimeSpan FAIL_WINDOW = TimeSpan.FromMinutes(10);
    private static readonly TimeSpan VERIFY_EXPIRES = TimeSpan.FromHours(24);
    private static readonly TimeSpan RESET_EXPIRES = TimeSpan.FromMinutes(30);
    private static readonly TimeSpan REFRESH_LIFETIME = TimeSpan.FromDays(14);

    public AuthController(GiftBoxShopContext db, IJwtService jwt, IEmailSender mail, IAuditService audit, IConfiguration cfg)
    {
        _db = db; _jwt = jwt; _mail = mail; _audit = audit; _cfg = cfg;
    }

    private int? GetUserIdOrNull()
    {
        var id = User.FindFirstValue(ClaimTypes.NameIdentifier)
              ?? User.FindFirstValue(ClaimTypes.Name)
              ?? User.FindFirstValue("sub");
        return int.TryParse(id, out var uid) ? uid : null;
    }

    private string Ip() => HttpContext.Connection.RemoteIpAddress?.ToString() ?? "";
    private string UA() => Request.Headers.UserAgent.ToString();
    private static string NewTokenHex(int bytes) => Convert.ToHexString(RandomNumberGenerator.GetBytes(bytes));

    /* ========== REGISTER ========== */
    [HttpPost("register")]
    [AllowAnonymous]
    public async Task<IActionResult> Register([FromBody] RegisterRequest req, CancellationToken ct)
    {
        var email = (req.Email ?? "").Trim().ToLowerInvariant();
        if (string.IsNullOrWhiteSpace(email) || string.IsNullOrWhiteSpace(req.Password))
            return BadRequest("Thiếu email hoặc mật khẩu.");

        if (await _db.Users.AnyAsync(x => x.Email == email, ct))
            return Conflict("Email đã tồn tại.");

        var user = new User
        {
            FullName = req.FullName?.Trim(),
            Email = email,
            Phone = req.Phone?.Trim(),
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(req.Password),
            Role = "Customer",
            IsActive = false, // bắt buộc verify
            CreatedAt = DateTime.UtcNow
        };
        _db.Users.Add(user);
        await _db.SaveChangesAsync(ct);

        // tạo verify token
        var token = NewTokenHex(32);
        _db.EmailVerifications.Add(new EmailVerification
        {
            UserId = user.UserId,
            Token = token,
            ExpiresAt = DateTime.UtcNow.Add(VERIFY_EXPIRES),
            CreatedAt = DateTime.UtcNow
        });
        await _db.SaveChangesAsync(ct);

        var verifyUrl = $"{_cfg["Frontend:BaseUrl"]?.TrimEnd('/')}/verify-email?token={token}";
        await _mail.SendAsync(
            user.Email,
            "[Heartoza] Xác thực email",
            $@"
        <p>Xin chào {System.Net.WebUtility.HtmlEncode(user.FullName ?? user.Email)},</p>
        <p>Cảm ơn bạn đã đăng ký tài khoản tại <b>Heartoza</b>.</p>
        <p>Để hoàn tất đăng ký, vui lòng bấm vào liên kết sau để xác thực email:</p>
        <p><a href='{verifyUrl}' style='color: #1a73e8;'>Xác thực tài khoản</a></p>
        <p>Nếu bạn không đăng ký tài khoản, hãy bỏ qua email này.</p>
        <p>Trân trọng,<br/>Đội ngũ Heartoza</p>
    ");


        await _audit.LogAsync(user.UserId, "REGISTER", null, Ip());
        return Ok(new { message = "Đăng ký thành công. Vui lòng kiểm tra email để xác thực." });
    }

    /* ========== RESEND VERIFY ========== */
    [HttpPost("resend-verify")]
    [AllowAnonymous]
    public async Task<IActionResult> ResendVerify([FromBody] ForgotRequest req, CancellationToken ct)
    {
        var email = (req.Email ?? "").Trim().ToLowerInvariant();
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Email == email, ct);
        if (user == null || user.IsActive == true)
            return Ok(new { message = "Nếu email hợp lệ/chưa xác thực, hướng dẫn đã được gửi." });

        // Invalidate tokens cũ
        var olds = _db.EmailVerifications.Where(v => v.UserId == user.UserId && v.UsedAt == null && v.ExpiresAt > DateTime.UtcNow);
        await olds.ForEachAsync(v => v.ExpiresAt = DateTime.UtcNow, ct);

        var token = NewTokenHex(32);
        _db.EmailVerifications.Add(new EmailVerification
        {
            UserId = user.UserId,
            Token = token,
            ExpiresAt = DateTime.UtcNow.Add(VERIFY_EXPIRES),
            CreatedAt = DateTime.UtcNow
        });
        await _db.SaveChangesAsync(ct);

        var verifyUrl = $"{_cfg["Frontend:BaseUrl"]?.TrimEnd('/')}/verify-email?token={token}";
        await _mail.SendAsync(user.Email, "[Heartoza] Xác thực email",
            $"<p>Nhấn để xác thực: <a href='{verifyUrl}'>Verify</a></p>");

        return Ok(new { message = "Nếu email hợp lệ/chưa xác thực, hướng dẫn đã được gửi." });
    }

    /* ========== VERIFY EMAIL ========== */
    [HttpGet("verify-email")]
    [AllowAnonymous]
    public async Task<IActionResult> VerifyEmail([FromQuery] string token, CancellationToken ct)
    {
        var ev = await _db.EmailVerifications.FirstOrDefaultAsync(x => x.Token == token && x.UsedAt == null, ct);
        if (ev == null || ev.ExpiresAt < DateTime.UtcNow)
            return BadRequest("Token không hợp lệ/hết hạn.");

        var user = await _db.Users.FindAsync(new object[] { ev.UserId }, ct);
        if (user == null) return BadRequest("User không tồn tại.");

        user.IsActive = true;
        ev.UsedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);

        await _audit.LogAsync(user.UserId, "VERIFY_EMAIL", null, Ip());
        return Ok(new { message = "Xác thực email thành công." });
    }

    /* ========== LOGIN ========== */
    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<IActionResult> Login([FromBody] LoginRequest req, CancellationToken ct)
    {
        var email = (req.Email ?? "").Trim().ToLowerInvariant();

        // lockout đơn giản
        var since = DateTime.UtcNow - FAIL_WINDOW;
        var fails = await _db.LoginAttempts.CountAsync(a =>
            a.Email == email && a.Success == false && a.CreatedAt >= since, ct);
        if (fails >= MAX_FAILS)
            return StatusCode(423, "Bạn đã thử sai quá nhiều. Vui lòng thử lại sau ít phút.");

        var user = await _db.Users.FirstOrDefaultAsync(x => x.Email == email, ct);
        var ok = user != null && BCrypt.Net.BCrypt.Verify(req.Password ?? "", user.PasswordHash);

        _db.LoginAttempts.Add(new LoginAttempt
        {
            Email = email,
            Ip = Ip(),
            Success = ok,
            CreatedAt = DateTime.UtcNow
        });

        if (!ok)
        {
            await _db.SaveChangesAsync(ct);
            return Unauthorized("Email hoặc mật khẩu không đúng.");
        }

        if (user!.IsActive != true)
        {
            await _db.SaveChangesAsync(ct);
            return Unauthorized("Tài khoản chưa xác thực email.");
        }

        user.LastLoginAt = DateTime.UtcNow;

        var access = _jwt.CreateAccessToken(user);
        var refresh = NewTokenHex(48);
        _db.RefreshTokens.Add(new RefreshToken
        {
            UserId = user.UserId,
            Token = refresh,
            ExpiresAt = DateTime.UtcNow.Add(REFRESH_LIFETIME),
            CreatedAt = DateTime.UtcNow,
            UserAgent = UA(),
            Ip = Ip()
        });

        await _db.SaveChangesAsync(ct);
        await _audit.LogAsync(user.UserId, "LOGIN_SUCCESS", null, Ip());

        return Ok(new AuthResponse
        {
            Token = access,
            RefreshToken = refresh,
            UserId = user.UserId,
            Email = user.Email,
            FullName = user.FullName,
            Role = user.Role ?? "Customer"
        });
    }

    /* ========== REFRESH ========== */
    [HttpPost("refresh")]
    [AllowAnonymous]
    public async Task<IActionResult> Refresh([FromBody] RefreshRequest req, CancellationToken ct)
    {
        var rt = await _db.RefreshTokens.FirstOrDefaultAsync(x => x.Token == req.RefreshToken && x.RevokedAt == null, ct);
        if (rt == null || rt.ExpiresAt < DateTime.UtcNow)
            return Unauthorized("Refresh token không hợp lệ/hết hạn.");

        var user = await _db.Users.FindAsync(new object[] { rt.UserId }, ct);
        if (user == null) return Unauthorized("User không tồn tại.");
        if (user.IsActive != true) return Unauthorized("Tài khoản chưa xác thực email.");

        var access = _jwt.CreateAccessToken(user);
        return Ok(new { token = access });
    }

    /* ========== LOGOUT CURRENT ========== */
    [HttpPost("logout")]
    [Authorize]
    public async Task<IActionResult> Logout([FromBody] RefreshRequest req, CancellationToken ct)
    {
        var uid = GetUserIdOrNull();
        if (uid == null) return Unauthorized();

        var rt = await _db.RefreshTokens.FirstOrDefaultAsync(x => x.Token == req.RefreshToken && x.UserId == uid, ct);
        if (rt != null && rt.RevokedAt == null)
        {
            rt.RevokedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync(ct);
        }

        await _audit.LogAsync(uid.Value, "LOGOUT", null, Ip());
        return Ok(new { message = "Đã đăng xuất phiên hiện tại." });
    }

    /* ========== LOGOUT ALL ========== */
    [HttpPost("logout-all")]
    [Authorize]
    public async Task<IActionResult> LogoutAll(CancellationToken ct)
    {
        var uid = GetUserIdOrNull();
        if (uid == null) return Unauthorized();

        var tokens = _db.RefreshTokens.Where(t => t.UserId == uid && t.RevokedAt == null);
        await tokens.ForEachAsync(t => t.RevokedAt = DateTime.UtcNow, ct);
        await _db.SaveChangesAsync(ct);

        await _audit.LogAsync(uid.Value, "LOGOUT_ALL", null, Ip());
        return Ok(new { message = "Đã đăng xuất khỏi tất cả thiết bị." });
    }

    /* ========== FORGOT ========== */
    [HttpPost("forgot")]
    [AllowAnonymous]
    public async Task<IActionResult> Forgot([FromBody] ForgotRequest req, CancellationToken ct)
    {
        var email = (req.Email ?? "").Trim().ToLowerInvariant();
        var user = await _db.Users.FirstOrDefaultAsync(x => x.Email == email, ct);
        if (user == null)
            return Ok(new { message = "Nếu email hợp lệ, hướng dẫn đã được gửi." });

        var token = NewTokenHex(32);
        _db.PasswordResets.Add(new PasswordReset
        {
            UserId = user.UserId,
            Token = token,
            ExpiresAt = DateTime.UtcNow.Add(RESET_EXPIRES),
            CreatedAt = DateTime.UtcNow
        });
        await _db.SaveChangesAsync(ct);

        var url = $"{_cfg["Frontend:BaseUrl"]?.TrimEnd('/')}/reset-password?token={token}";
        await _mail.SendAsync(
            user.Email,
            "[Heartoza] Đặt lại mật khẩu",
            $@"
        <p>Xin chào {System.Net.WebUtility.HtmlEncode(user.FullName ?? user.Email)},</p>
        <p>Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn.</p>
        <p>Nhấn vào liên kết sau để đổi mật khẩu mới (hạn trong 30 phút):</p>
        <p><a href='{url}'>Đặt lại mật khẩu</a></p>
        <p>Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email.</p>
    ");


        return Ok(new { message = "Nếu email hợp lệ, hướng dẫn đã được gửi." });
    }

    /* ========== RESET ========== */
    [HttpPost("reset")]
    [AllowAnonymous]
    public async Task<IActionResult> Reset([FromBody] ResetRequest req, CancellationToken ct)
    {
        var pr = await _db.PasswordResets.FirstOrDefaultAsync(x => x.Token == req.Token && x.UsedAt == null, ct);
        if (pr == null || pr.ExpiresAt < DateTime.UtcNow)
            return BadRequest("Token không hợp lệ hoặc đã hết hạn.");

        var user = await _db.Users.FindAsync(new object[] { pr.UserId }, ct);
        if (user == null) return BadRequest("User không tồn tại.");

        var pw = req.NewPassword ?? "";
        if (pw.Length < 8 || !pw.Any(char.IsLetter) || !pw.Any(char.IsDigit))
            return BadRequest("Mật khẩu mới tối thiểu 8 ký tự, gồm chữ & số.");

        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(pw);
        pr.UsedAt = DateTime.UtcNow;

        var tokens = _db.RefreshTokens.Where(t => t.UserId == user.UserId && t.RevokedAt == null);
        await tokens.ForEachAsync(t => t.RevokedAt = DateTime.UtcNow, ct);

        await _db.SaveChangesAsync(ct);
        await _audit.LogAsync(user.UserId, "RESET_PASSWORD", null, Ip());
        return Ok(new { message = "Đặt lại mật khẩu thành công." });
    }

    /* ========== SESSIONS LIST ========== */
    [HttpGet("sessions")]
    [Authorize]
    public async Task<IActionResult> Sessions(CancellationToken ct)
    {
        var uid = GetUserIdOrNull();
        if (uid == null) return Unauthorized();

        var list = await _db.RefreshTokens
            .Where(t => t.UserId == uid)
            .OrderByDescending(t => t.CreatedAt)
            .Select(t => new
            {
                t.RefreshTokenId,
                t.CreatedAt,
                t.ExpiresAt,
                t.RevokedAt,
                t.UserAgent,
                t.Ip
            })
            .ToListAsync(ct);

        return Ok(list);
    }

    /* ========== REVOKE ONE SESSION ========== */
    [HttpPost("sessions/{id:int}/revoke")]
    [Authorize]
    public async Task<IActionResult> RevokeOne([FromRoute] int id, CancellationToken ct)
    {
        var uid = GetUserIdOrNull();
        if (uid == null) return Unauthorized();

        var rt = await _db.RefreshTokens.FirstOrDefaultAsync(x => x.RefreshTokenId == id && x.UserId == uid, ct);
        if (rt == null) return NotFound();

        if (rt.RevokedAt == null) rt.RevokedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);

        await _audit.LogAsync(uid.Value, "REVOKE_SESSION", $"RefreshTokenId={id}", Ip());
        return Ok(new { message = "Đã thu hồi phiên." });
    }
}
