namespace Heartoza.DTO.Products
{
    // ====== DTO dùng cho chi tiết sản phẩm ======
    public class ProductDetailResponse
    {
        public int ProductId { get; set; }
        public string Name { get; set; } = default!;
        public string Sku { get; set; } = default!;
        public decimal Price { get; set; }
        public int CategoryId { get; set; }
        public string CategoryName { get; set; } = default!;
        public bool? IsActive { get; set; }
        public DateTime? CreatedAt { get; set; }
        public int OnHand { get; set; }
    }
}
