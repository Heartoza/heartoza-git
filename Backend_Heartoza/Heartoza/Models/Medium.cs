using System;
using System.Collections.Generic;

namespace Heartoza.Models;

public partial class Medium
{
    public long MediaId { get; set; }

    public string StorageAccount { get; set; } = null!;

    public string Container { get; set; } = null!;

    public string BlobPath { get; set; } = null!;

    public string FileName { get; set; } = null!;

    public string ContentType { get; set; } = null!;

    public long ByteSize { get; set; }

    public int? Width { get; set; }

    public int? Height { get; set; }

    public string SourceType { get; set; } = null!;

    public string? ExternalUrl { get; set; }

    public string Status { get; set; } = null!;

    public DateTime CreatedAt { get; set; }

    public virtual ICollection<Banner> Banners { get; set; } = new List<Banner>();

    public virtual ICollection<ProductMedium> ProductMedia { get; set; } = new List<ProductMedium>();

    public virtual ICollection<SeoMetum> SeoMeta { get; set; } = new List<SeoMetum>();

    public virtual ICollection<UserMedium> UserMedia { get; set; } = new List<UserMedium>();
}
