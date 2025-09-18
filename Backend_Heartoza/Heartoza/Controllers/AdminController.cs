using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Heartoza.Models;
using Heartoza.DTO.Products;
using Heartoza.DTO.Categories;

namespace Heartoza.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin")] // chỉ Admin
public class AdminController : ControllerBase
{
    private readonly GiftBoxShopContext _db;
    public AdminController(GiftBoxShopContext db) => _db = db;

    // ========================== USER MANAGEMENT ==========================

    [HttpGet("users")]
    public async Task<IActionResult> GetUsers([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        if (page <= 0) page = 1;
        if (pageSize <= 0 || pageSize > 100) pageSize = 20;

        var query = _db.Users.AsNoTracking().OrderBy(u => u.UserId);

        var total = await query.CountAsync();
        var items = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(u => new
            {
                u.UserId,
                u.FullName,
                u.Email,
                u.Role,
                u.Phone,
                u.CreatedAt,
                u.IsActive
            })
            .ToListAsync();

        return Ok(new { page, pageSize, total, items });
    }

    [HttpPost("users/{id:int}/toggle")]
    public async Task<IActionResult> ToggleUser(int id)
    {
        var user = await _db.Users.FindAsync(id);
        if (user == null) return NotFound();

        user.IsActive = !(user.IsActive ?? true);
        await _db.SaveChangesAsync();

        return Ok(new { user.UserId, user.Email, user.IsActive });
    }

    // ========================== ORDER MANAGEMENT ==========================

    [HttpGet("orders")]
    public async Task<IActionResult> GetOrders([FromQuery] string? status, [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        if (page <= 0) page = 1;
        if (pageSize <= 0 || pageSize > 100) pageSize = 20;

        var query = _db.Orders.Include(o => o.User).AsNoTracking();

        if (!string.IsNullOrEmpty(status))
            query = query.Where(o => o.Status == status);

        var total = await query.CountAsync();
        var items = await query
            .OrderByDescending(o => o.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(o => new
            {
                o.OrderId,
                o.OrderCode,
                o.UserId,
                UserName = o.User.FullName,
                o.Status,
                o.GrandTotal,
                o.CreatedAt
            })
            .ToListAsync();

        return Ok(new { page, pageSize, total, items });
    }

    [HttpPost("orders/{id:int}/status")]
    public async Task<IActionResult> UpdateOrderStatus(int id, [FromBody] string newStatus)
    {
        if (string.IsNullOrWhiteSpace(newStatus))
            return BadRequest("Trạng thái mới không hợp lệ.");

        var order = await _db.Orders.FindAsync(id);
        if (order == null) return NotFound();

        order.Status = newStatus.Trim();
        await _db.SaveChangesAsync();

        return Ok(new { order.OrderId, order.Status });
    }

    // ========================== PRODUCT MANAGEMENT ==========================

    // NOTE: ProductDto cần có các field sau (đúng với FE list):
    // ProductId, Name, Sku, Price, CategoryId, IsActive, CreatedAt
    // Nếu file ProductDto của anh đang trống => thêm các property trên nhé.

    [HttpGet("products")]
    public async Task<IActionResult> GetProducts([FromQuery] string? q, [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        if (page <= 0) page = 1;
        if (pageSize <= 0 || pageSize > 100) pageSize = 20;

        var query = _db.Products.AsNoTracking();

        if (!string.IsNullOrWhiteSpace(q))
        {
            var pattern = $"%{q.Trim()}%";
            query = query.Where(p => EF.Functions.Like(p.Name, pattern) || EF.Functions.Like(p.Sku, pattern));
        }

        var total = await query.CountAsync();

        var items = await query
            .OrderByDescending(p => p.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(p => new ProductDto
            {
                ProductId = p.ProductId,
                Name = p.Name,
                Sku = p.Sku,
                Price = p.Price,
                CategoryId = p.CategoryId,
                IsActive = p.IsActive,
                CreatedAt = p.CreatedAt
            })
            .ToListAsync();

        return Ok(new { page, pageSize, total, items });
    }

    // Chi tiết sản phẩm (kèm CategoryName + OnHand)
    [HttpGet("products/{id:int}")]
    public async Task<IActionResult> GetProductDetail(int id)
    {
        var dto = await _db.Products
            .AsNoTracking()
            .Where(p => p.ProductId == id)
            .Select(p => new ProductDetailResponse
            {
                ProductId = p.ProductId,
                Name = p.Name,
                Sku = p.Sku,
                Price = p.Price,
                CategoryId = p.CategoryId,
                CategoryName = p.Category.Name,
                IsActive = p.IsActive,
                CreatedAt = p.CreatedAt,
                OnHand = _db.Inventories.Where(i => i.ProductId == p.ProductId).Select(i => (int?)i.Quantity).FirstOrDefault() ?? 0
            })
            .FirstOrDefaultAsync();

        if (dto == null) return NotFound();
        return Ok(dto);
    }

    // Thêm sản phẩm (dùng ProductDto làm input)
    [HttpPost("products")]
    public async Task<IActionResult> CreateProduct([FromBody] ProductCreateDto req)
    {
        if (string.IsNullOrWhiteSpace(req.Name))
            return BadRequest("Tên sản phẩm không được để trống.");
        if (req.Price <= 0)
            return BadRequest("Giá sản phẩm phải > 0.");

        var prod = new Product
        {
            Name = req.Name,
            Sku = req.Sku,
            Price = req.Price,
            CategoryId = req.CategoryId,
            CreatedAt = DateTime.UtcNow,
            IsActive = true
        };

        _db.Products.Add(prod);
        await _db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetProducts), new { id = prod.ProductId }, new
        {
            prod.ProductId,
            prod.Name,
            prod.Sku,
            prod.Price,
            prod.CategoryId,
            prod.IsActive,
            prod.CreatedAt
        });
    }


    // Sửa sản phẩm (input ProductDto)
    [HttpPut("products/{id:int}")]
    public async Task<IActionResult> UpdateProduct(int id, [FromBody] ProductCreateDto req)
    {
        var prod = await _db.Products.FindAsync(id);
        if (prod == null) return NotFound();

        prod.Name = req.Name;
        prod.Sku = req.Sku;
        prod.Price = req.Price;
        prod.CategoryId = req.CategoryId;

        await _db.SaveChangesAsync();

        return Ok(new
        {
            prod.ProductId,
            prod.Name,
            prod.Sku,
            prod.Price,
            prod.CategoryId,
            prod.IsActive
        });
    }


    [HttpDelete("products/{id:int}")]
    public async Task<IActionResult> DeleteProduct(int id)
    {
        var prod = await _db.Products.FindAsync(id);
        if (prod == null) return NotFound();

        _db.Products.Remove(prod);
        await _db.SaveChangesAsync();

        return Ok(new { Message = $"Đã xóa sản phẩm {id}" });
    }

    // ========================== CATEGORY MANAGEMENT ==========================

    // includeCounts=true => trả ProductCount
    [HttpGet("categories")]
    public async Task<IActionResult> GetCategories([FromQuery] bool includeCounts = false)
    {
        if (!includeCounts)
        {
            var cats = await _db.Categories
                .AsNoTracking()
                .OrderBy(c => c.Name)
                .Select(c => new CategoryItemDto
                {
                    CategoryId = c.CategoryId,
                    Name = c.Name,
                    ParentId = c.ParentId,
                    ProductCount = 0
                })
                .ToListAsync();

            return Ok(cats);
        }
        else
        {
            // Đếm sản phẩm theo CategoryId
            var counts = await _db.Products
                .GroupBy(p => p.CategoryId)
                .Select(g => new { CategoryId = g.Key, Count = g.Count() })
                .ToDictionaryAsync(x => x.CategoryId, x => x.Count);

            var cats = await _db.Categories
                .AsNoTracking()
                .OrderBy(c => c.Name)
                .Select(c => new CategoryItemDto
                {
                    CategoryId = c.CategoryId,
                    Name = c.Name,
                    ParentId = c.ParentId,
                    ProductCount = counts.ContainsKey(c.CategoryId) ? counts[c.CategoryId] : 0
                })
                .ToListAsync();

            return Ok(cats);
        }
    }

    [HttpPost("categories")]
    public async Task<IActionResult> CreateCategory([FromBody] CategoryCreateDto req)
    {
        if (string.IsNullOrWhiteSpace(req.Name))
            return BadRequest("Tên category không được để trống.");

        var entity = new Category
        {
            Name = req.Name.Trim(),
            ParentId = req.ParentId
        };

        _db.Categories.Add(entity);
        await _db.SaveChangesAsync();

        var dto = new CategoryItemDto
        {
            CategoryId = entity.CategoryId,
            Name = entity.Name,
            ParentId = entity.ParentId,
            ProductCount = 0
        };

        return CreatedAtAction(nameof(GetCategories), new { id = entity.CategoryId }, dto);
    }

    [HttpPut("categories/{id:int}")]
    public async Task<IActionResult> UpdateCategory(int id, [FromBody] CategoryUpdateDto req)
    {
        var cat = await _db.Categories.FindAsync(id);
        if (cat == null) return NotFound();

        if (req.Name != null)
        {
            if (string.IsNullOrWhiteSpace(req.Name))
                return BadRequest("Tên category không được để trống.");
            cat.Name = req.Name.Trim();
        }

        // Phân biệt: không gửi ParentId vs gửi null
        if (req.ParentIdHasValue)
        {
            cat.ParentId = req.ParentId; // có thể null => đẩy về root
        }

        await _db.SaveChangesAsync();

        var dto = new CategoryItemDto
        {
            CategoryId = cat.CategoryId,
            Name = cat.Name,
            ParentId = cat.ParentId,
            ProductCount = await _db.Products.CountAsync(p => p.CategoryId == cat.CategoryId)
        };

        return Ok(dto);
    }

    [HttpDelete("categories/{id:int}")]
    public async Task<IActionResult> DeleteCategory(int id)
    {
        var cat = await _db.Categories.FindAsync(id);
        if (cat == null) return NotFound();

        var hasProducts = await _db.Products.AnyAsync(p => p.CategoryId == id);
        if (hasProducts)
            return BadRequest("Không thể xóa category vì vẫn còn sản phẩm.");

        _db.Categories.Remove(cat);
        await _db.SaveChangesAsync();

        return Ok(new { Message = $"Đã xóa category {id}" });
    }
}
