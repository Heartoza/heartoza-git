using System;
using System.Collections.Generic;

namespace Heartoza.Models;

public partial class VoucherUsage
{
    public int VoucherUsageId { get; set; }

    public int VoucherId { get; set; }

    public int? UserId { get; set; }

    public int? OrderId { get; set; }

    public DateTime UsedAt { get; set; }

    public decimal DiscountApplied { get; set; }

    public virtual Order? Order { get; set; }

    public virtual User? User { get; set; }

    public virtual Voucher Voucher { get; set; } = null!;
}
