using System;
using System.Collections.Generic;

namespace Heartoza.Models;

public partial class RefreshToken
{
    public int RefreshTokenId { get; set; }

    public int UserId { get; set; }

    public string Token { get; set; } = null!;

    public DateTime ExpiresAt { get; set; }

    public DateTime? RevokedAt { get; set; }

    public DateTime CreatedAt { get; set; }

    public string? UserAgent { get; set; }

    public string? Ip { get; set; }

    public virtual User User { get; set; } = null!;
}
