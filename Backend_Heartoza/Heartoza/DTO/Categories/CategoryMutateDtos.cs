namespace Heartoza.Dtos.Categories
{
    public class CategoryCreateDto
    {
        public string Name { get; set; } = default!;
        public int? ParentId { get; set; } // null => root
    }

    /// <summary>
    /// Update có 2 field: Name (optional), ParentId (optional)
    /// Nếu client không gửi ParentId => giữ nguyên
    /// Nếu client gửi ParentId = null => đẩy về root
    /// </summary>
    public class CategoryUpdateDto
    {
        public string? Name { get; set; }

        // Trick để phân biệt "không gửi" vs "gửi null":
        // - ParentIdHasValue = true khi client có gửi thuộc tính "parentId"
        // - ParentId là giá trị (có thể null) được gửi
        public bool ParentIdHasValue { get; set; } = false;
        public int? ParentId { get; set; }
    }
}
