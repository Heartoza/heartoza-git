using System;
using System.Collections.Generic;

namespace Heartoza.Models;

public partial class Banner
{
    public int BannerId { get; set; }

    public string? Title { get; set; }

    public long? MediaId { get; set; }

    public string? ExternalImageUrl { get; set; }

    public string? LinkUrl { get; set; }

    public bool OpenInNewTab { get; set; }

    public string Position { get; set; } = null!;

    public int SortOrder { get; set; }

    public bool IsActive { get; set; }

    public DateTime? StartAt { get; set; }

    public DateTime? EndAt { get; set; }

    public DateTime CreatedAt { get; set; }

    public int? CreatedByUserId { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public int? UpdatedByUserId { get; set; }

    public virtual User? CreatedByUser { get; set; }

    public virtual Medium? Media { get; set; }

    public virtual User? UpdatedByUser { get; set; }
}
