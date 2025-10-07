using System;
using System.Collections.Generic;

namespace Heartoza.Models;

public partial class UserMedium
{
    public long UserMediaId { get; set; }

    public int UserId { get; set; }

    public long MediaId { get; set; }

    public bool IsPrimary { get; set; }

    public int SortOrder { get; set; }

    public DateTime CreatedAt { get; set; }

    public virtual Medium Media { get; set; } = null!;

    public virtual User User { get; set; } = null!;
}
