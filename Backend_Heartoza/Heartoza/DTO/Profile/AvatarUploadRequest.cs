namespace Heartoza.DTO.Profile
{
    public sealed class AvatarUploadRequest
    {
        public IFormFile file { get; set; } = default!;
    }
}
