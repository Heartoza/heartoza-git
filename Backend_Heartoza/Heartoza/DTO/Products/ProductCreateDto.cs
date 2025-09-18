namespace Heartoza.DTO.Products
{
    public class ProductCreateDto
    {
        public string Name { get; set; } = default!;
        public string Sku { get; set; } = default!;
        public decimal Price { get; set; }
        public int CategoryId { get; set; }
    }
}
