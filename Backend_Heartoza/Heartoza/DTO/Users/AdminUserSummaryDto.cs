namespace Heartoza.DTO.Users;


public class AdminUserSummaryDto
{
    public int UserId { get; set; }
    public string Email { get; set; } = default!;
    public string? FullName { get; set; }
    public string? Phone { get; set; }
    public string Role { get; set; } = "Customer";
    public bool IsActive { get; set; }
    public DateTime? LastLoginAt { get; set; }
    public DateTime CreatedAt { get; set; }
}


public class AdminUserDetailDto : AdminUserSummaryDto { }


public class AdminUserListQuery
{
    public string? Q { get; set; } // name/email search
    public string? Role { get; set; } // Admin/Staff/Customer
    public bool? Active { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;
    public string? Sort { get; set; } // createdAt_desc (default), createdAt_asc, name_asc, name_desc, email_asc, email_desc
}


public class AdminUpdateUserDto
{
    public string? FullName { get; set; }
    public string? Phone { get; set; }
    public string? Role { get; set; }          // Admin/Staff/Customer
    public bool? IsActive { get; set; }
}


public class PagedResult<T>
{
    public required IReadOnlyList<T> Items { get; init; }
    public int Total { get; init; }
    public int Page { get; init; }
    public int PageSize { get; init; }
}