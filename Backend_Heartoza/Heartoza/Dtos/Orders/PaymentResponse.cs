namespace Heartoza.Dtos.Orders
{
    public class PaymentResponse
    {
        public int PaymentId { get; set; }
        public decimal Amount { get; set; }
        public string Method { get; set; } = default!;
        public string Status { get; set; } = default!;
        public DateTime? CreatedAt { get; set; }
    }
}
