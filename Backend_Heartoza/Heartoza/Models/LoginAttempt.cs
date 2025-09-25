using System;
using System.Collections.Generic;

namespace Heartoza.Models;

public partial class LoginAttempt
{
    public long Id { get; set; }

    public string? Email { get; set; }

    public string? Ip { get; set; }

    public bool Success { get; set; }

    public DateTime CreatedAt { get; set; }
}
