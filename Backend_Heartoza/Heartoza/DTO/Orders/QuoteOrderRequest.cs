namespace Heartoza.DTO.Orders
{
    public class QuoteOrderRequest
    {
        public decimal ShippingFee { get; set; } = 0;
        public List<OrderLine> Items { get; set; } = new();
    }
}
