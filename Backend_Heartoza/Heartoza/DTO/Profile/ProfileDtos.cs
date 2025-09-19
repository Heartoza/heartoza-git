namespace Heartoza.DTO.Profile
{
    public class ProfileResponse
    {
        public int UserId { get; set; }
        public string FullName { get; set; } = default!;
        public string Email { get; set; } = default!;
        public string? Phone { get; set; }
        public string Role { get; set; } = "Customer";
        public bool? IsActive { get; set; }
        public DateTime? CreatedAt { get; set; }

        // NEW: ảnh đại diện
        public string? AvatarUrl { get; set; }

        // NEW: danh sách địa chỉ
        public List<AddressResponse> Addresses { get; set; } = new();

        // NEW: id địa chỉ mặc định
        public int? DefaultAddressId { get; set; }
    }

    public class UpdateProfileRequest
    {
        public string? FullName { get; set; }
        public string? Phone { get; set; }

        // NEW: cho phép update avatar
        public string? AvatarUrl { get; set; }
    }

    public class ChangePasswordRequest
    {
        public string CurrentPassword { get; set; } = default!;
        public string NewPassword { get; set; } = default!;
    }

    // NEW: DTO cho địa chỉ
    public class AddressResponse
    {
        public int AddressId { get; set; }
        public string? FullName { get; set; }
        public string? Line1 { get; set; }
        public string? District { get; set; }
        public string? City { get; set; }
        public string Country { get; set; } = "Vietnam";
        public string? PostalCode { get; set; }
        public string? Phone { get; set; }
        public bool IsDefault { get; set; }
    }

    // NEW: request thêm/sửa địa chỉ
    public class UpsertAddressRequest
    {
        public string? FullName { get; set; }
        public string? Line1 { get; set; }
        public string? District { get; set; }
        public string? City { get; set; }
        public string Country { get; set; } = "Vietnam";
        public string? PostalCode { get; set; }
        public string? Phone { get; set; }
        public bool IsDefault { get; set; } = false;
    }
}
