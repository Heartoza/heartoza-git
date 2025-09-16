namespace Heartoza.Dtos.Categories
{
    public class CategoryItemDto
    {
        public int CategoryId { get; set; }
        public string Name { get; set; } = default!;
        public int? ParentId { get; set; }
        public int ProductCount { get; set; } = 0; // chỉ có khi includeCounts=true
    }
}
