namespace Heartoza.DTO.Orders
{
    public class OrderListItemResponse
    {
        public int OrderId { get; set; }
        public string OrderCode { get; set; } = default!;
        public int UserId { get; set; }
        public string Status { get; set; } = default!;
        public decimal GrandTotal { get; set; }
        public DateTime? CreatedAt { get; set; }
    }

    public class PagedResponse<T>
    {
        public int Page { get; set; }
        public int PageSize { get; set; }
        public int Total { get; set; }
        public List<T> Items { get; set; } = new();
    }
}
