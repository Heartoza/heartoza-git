namespace Heartoza.DTO.Products
{
    public sealed class ReorderRequestItem { public long ProductMediaId { get; set; } public int SortOrder { get; set; } }
    public sealed class ReorderRequest { public List<ReorderRequestItem> Items { get; set; } = new(); }

}
