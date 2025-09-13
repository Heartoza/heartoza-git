namespace Heartoza.Dtos.Orders
{
    public class OrderResponse
    {
        public int OrderId { get; set; }
        public string OrderCode { get; set; } = default!;
        public int UserId { get; set; }
        public int ShippingAddressId { get; set; }
        public decimal Subtotal { get; set; }
        public decimal ShippingFee { get; set; }
        public decimal GrandTotal { get; set; }
        public string Status { get; set; } = default!;
        public DateTime? CreatedAt { get; set; }

        public List<OrderItemResponse> Items { get; set; } = new();
        public List<PaymentResponse> Payments { get; set; } = new();
        public List<ShipmentResponse> Shipments { get; set; } = new();
    }
}
