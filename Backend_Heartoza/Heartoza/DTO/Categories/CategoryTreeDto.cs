namespace Heartoza.DTO.Categories
{
    public class CategoryTreeDto
    {
        public int CategoryId { get; set; }
        public string Name { get; set; } = default!;
        public int? ParentId { get; set; }
        public int ProductCount { get; set; } = 0;
        public List<CategoryTreeDto> Children { get; set; } = new();
    }
}
