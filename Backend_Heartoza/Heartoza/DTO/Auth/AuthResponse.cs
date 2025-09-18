namespace Heartoza.DTO.Auth
{
    public class AuthResponse
    {
        public string Token { get; set; } = default!;
        public int UserId { get; set; }
        public string Email { get; set; } = default!;
        public string FullName { get; set; } = default!;
        public string Role { get; set; } = default!;
    }
}
