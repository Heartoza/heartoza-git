namespace Heartoza.DTO.Products
{
    public sealed class ProductImageUploadRequest
    {
        public IFormFile file { get; set; } = default!;
        public bool AsPrimary { get; set; } = true;
    }
}
