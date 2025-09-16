namespace Heartoza.Dtos.Orders
{
    public class UpdateOrderStatusRequest
    {
        public string NextStatus { get; set; } = default!; // Pending/Paid/Packing/Shipped/Delivered/Cancelled
    }
}
