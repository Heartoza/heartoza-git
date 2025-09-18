namespace Heartoza.DTO.Orders
{
    public class UpdateShipmentRequest
    {
        public string? Carrier { get; set; }
        public string? TrackingCode { get; set; }
        public string? Status { get; set; } // Packing / Shipped / Delivered...
    }
}
