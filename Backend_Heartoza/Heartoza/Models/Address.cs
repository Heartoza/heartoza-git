using System;
using System.Collections.Generic;

namespace Heartoza.Models;

public partial class Address
{
    public int AddressId { get; set; }

    public int UserId { get; set; }

    public string FullName { get; set; } = null!;

    public string Phone { get; set; } = null!;

    public string Line1 { get; set; } = null!;

    public string City { get; set; } = null!;

    public string? District { get; set; }

    public string Country { get; set; } = null!;

    public string? PostalCode { get; set; }

    public bool IsDefault { get; set; }

    public virtual ICollection<Order> Orders { get; set; } = new List<Order>();

    public virtual User User { get; set; } = null!;
}
