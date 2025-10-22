using System;
using System.Collections.Generic;

namespace Heartoza.Models;

public partial class SeoMetum
{
    public int SeoMetaId { get; set; }

    public string Slug { get; set; } = null!;

    public string? Title { get; set; }

    public string? Description { get; set; }

    public string? Keywords { get; set; }

    public long? ImageMediaId { get; set; }

    public string? OgImageUrl { get; set; }

    public string? CanonicalUrl { get; set; }

    public bool NoIndex { get; set; }

    public bool NoFollow { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public virtual Medium? ImageMedia { get; set; }
}
