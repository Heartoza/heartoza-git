namespace Heartoza.Dtos.Orders
{
    public class ShipmentResponse
    {
        public int ShipmentId { get; set; }
        public string? Carrier { get; set; }
        public string? TrackingCode { get; set; }
        public string Status { get; set; } = default!;
        public DateTime? CreatedAt { get; set; }
    }
}
