namespace Heartoza.Dtos.Orders
{
    public class QuoteStockIssue
    {
        public int ProductId { get; set; }
        public int Requested { get; set; }
        public int Available { get; set; }
        public string? ProductName { get; set; }
        public string? Sku { get; set; }
    }

    public class QuoteOrderResponse
    {
        public decimal Subtotal { get; set; }
        public decimal ShippingFee { get; set; }
        public decimal GrandTotal { get; set; }
        public bool HasGiftBox { get; set; }
        public List<int> MissingProductIds { get; set; } = new();
        public List<QuoteStockIssue> StockIssues { get; set; } = new();
    }
}
