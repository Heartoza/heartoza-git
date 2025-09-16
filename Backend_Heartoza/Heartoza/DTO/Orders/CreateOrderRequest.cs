namespace Heartoza.Dtos.Orders
{
    public class CreateOrderRequest
    {
        public int UserId { get; set; }
        public int ShippingAddressId { get; set; }
        public decimal ShippingFee { get; set; } = 0;
        public string? Method { get; set; }
        public List<OrderLine> Items { get; set; } = new();
    }

    public class OrderLine
    {
        public int ProductId { get; set; }
        public int Quantity { get; set; }
    }
}
