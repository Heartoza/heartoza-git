using System;
using System.Collections.Generic;

namespace Heartoza.Models;

public partial class AuditLog
{
    public long Id { get; set; }

    public int? UserId { get; set; }

    public string Action { get; set; } = null!;

    public string? Detail { get; set; }

    public string? Ip { get; set; }

    public DateTime CreatedAt { get; set; }

    public virtual User? User { get; set; }
}
