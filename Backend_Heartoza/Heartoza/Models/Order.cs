using System;
using System.Collections.Generic;

namespace Heartoza.Models;

public partial class Order
{
    public int OrderId { get; set; }

    public string OrderCode { get; set; } = null!;

    public int UserId { get; set; }

    public int ShippingAddressId { get; set; }

    public decimal Subtotal { get; set; }

    public decimal? ShippingFee { get; set; }

    public decimal GrandTotal { get; set; }

    public string? Status { get; set; }

    public DateTime? CreatedAt { get; set; }

    public string? Comment { get; set; }

    public virtual ICollection<OrderItem> OrderItems { get; set; } = new List<OrderItem>();

    public virtual ICollection<Payment> Payments { get; set; } = new List<Payment>();

    public virtual ICollection<Shipment> Shipments { get; set; } = new List<Shipment>();

    public virtual Address ShippingAddress { get; set; } = null!;

    public virtual User User { get; set; } = null!;
}
