namespace Heartoza.DTO.Products
{
    // Dùng cho update từng phần: field nào không gửi thì giữ nguyên
    public class ProductUpdateDto
    {
        public string? Name { get; set; }
        public string? Sku { get; set; }
        public decimal? Price { get; set; }
        public int? CategoryId { get; set; }
        public bool? IsActive { get; set; }
    }
}
