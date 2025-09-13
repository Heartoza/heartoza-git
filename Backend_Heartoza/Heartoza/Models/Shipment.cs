using System;
using System.Collections.Generic;

namespace Heartoza.Models;

public partial class Shipment
{
    public int ShipmentId { get; set; }

    public int OrderId { get; set; }

    public string? Carrier { get; set; }

    public string? TrackingCode { get; set; }

    public string Status { get; set; } = null!;

    public DateTime? ShippedAt { get; set; }

    public DateTime? DeliveredAt { get; set; }

    public DateTime CreatedAt { get; set; }

    public virtual Order Order { get; set; } = null!;
}
