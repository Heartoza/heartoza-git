using System;
using System.Collections.Generic;

namespace Heartoza.Models;

public partial class ProductMedium
{
    public long ProductMediaId { get; set; }

    public int ProductId { get; set; }

    public long MediaId { get; set; }

    public bool IsPrimary { get; set; }

    public int SortOrder { get; set; }

    public DateTime CreatedAt { get; set; }

    public virtual Medium Media { get; set; } = null!;

    public virtual Product Product { get; set; } = null!;
}
