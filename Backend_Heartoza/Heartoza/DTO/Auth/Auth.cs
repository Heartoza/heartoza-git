namespace Heartoza.DTO.Auth
{
    public class LoginRequest { public string Email { get; set; } = ""; public string Password { get; set; } = ""; }
    public class RegisterRequest { public string FullName { get; set; } = ""; public string Email { get; set; } = ""; public string Password { get; set; } = ""; public string? Phone { get; set; } }
    public class AuthResponse { public string Token { get; set; } = ""; public string RefreshToken { get; set; } = ""; public int UserId { get; set; } public string Email { get; set; } = ""; public string? FullName { get; set; } public string Role { get; set; } = "Customer"; }
    public class RefreshRequest { public string RefreshToken { get; set; } = ""; }
    public class ForgotRequest { public string Email { get; set; } = ""; }
    public class ResetRequest { public string Token { get; set; } = ""; public string NewPassword { get; set; } = ""; }
    public class VerifyEmailRequest { public string Token { get; set; } = ""; }
}
