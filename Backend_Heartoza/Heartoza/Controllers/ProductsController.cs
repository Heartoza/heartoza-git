using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using System.Collections.Generic;
using Heartoza.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Heartoza.DTO.Products;

[ApiController]
[Route("api/[controller]")]
public class ProductsController : ControllerBase
{
    private readonly GiftBoxShopContext _db;
    public ProductsController(GiftBoxShopContext db) => _db = db;

    // GET /api/products?categoryId=1&categoryIds=2&categoryIds=3&q=tra&minPrice=10000&maxPrice=90000&active=true&page=1&pageSize=20&sort=name
    [HttpGet]
    public async Task<IActionResult> Get(
        [FromQuery] int? categoryId,
        [FromQuery] List<int>? categoryIds,               // hỗ trợ nhiều category
        [FromQuery] string? q,
        [FromQuery] decimal? minPrice,
        [FromQuery] decimal? maxPrice,
        [FromQuery] bool? active,                         // admin có thể set true/false; mặc định chỉ lấy active
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? sort = "name",
        CancellationToken ct = default)
    {
        if (page <= 0) page = 1;
        if (pageSize <= 0 || pageSize > 100) pageSize = 20;

        var query = _db.Products.AsNoTracking().AsQueryable();

        // Trạng thái: mặc định chỉ lấy active
        if (active is null)
            query = query.Where(p => p.IsActive == true);
        else
            query = query.Where(p => p.IsActive == active.Value);

        // Category filter (1 hoặc nhiều)
        if (categoryId.HasValue)
            query = query.Where(p => p.CategoryId == categoryId.Value);
        if (categoryIds != null && categoryIds.Count > 0)
            query = query.Where(p => categoryIds.Contains(p.CategoryId));

        // Keyword
        if (!string.IsNullOrWhiteSpace(q))
        {
            var pattern = $"%{q.Trim()}%";
            query = query.Where(p => EF.Functions.Like(p.Name, pattern) ||
                                     EF.Functions.Like(p.Sku, pattern));
        }

        // Price range
        if (minPrice.HasValue) query = query.Where(p => p.Price >= minPrice.Value);
        if (maxPrice.HasValue) query = query.Where(p => p.Price <= maxPrice.Value);

        // sort: name | price | created | sku  (mặc định name)
        query = sort?.ToLowerInvariant() switch
        {
            "price" => query.OrderBy(p => p.Price).ThenBy(p => p.Name),
            "created" => query.OrderByDescending(p => p.CreatedAt).ThenBy(p => p.Name),
            "sku" => query.OrderBy(p => p.Sku),
            "-name" => query.OrderByDescending(p => p.Name),
            "-price" => query.OrderByDescending(p => p.Price).ThenBy(p => p.Name),
            "-created" => query.OrderBy(p => p.CreatedAt).ThenBy(p => p.Name),
            "-sku" => query.OrderByDescending(p => p.Sku),
            _ => query.OrderBy(p => p.Name)
        };

        var total = await query.CountAsync(ct);
        var totalPages = (int)Math.Ceiling(total / (double)pageSize);

        var items = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(p => new {
                p.ProductId,
                p.Name,
                p.Sku,
                p.Price,
                p.CategoryId,
                p.IsActive,
                p.CreatedAt
            })
            .ToListAsync(ct);

        return Ok(new
        {
            page,
            pageSize,
            total,
            totalPages,
            items
        });
    }

    // GET /api/products/{id}
    // Trả thêm CategoryName + tồn kho hiện tại (Inventory.Quantity)
    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id, [FromQuery] bool includeInactive = false, CancellationToken ct = default)
    {
        var product = await _db.Products
            .AsNoTracking()
            .Where(x => x.ProductId == id && (includeInactive || x.IsActive == true))
            .Select(x => new ProductDetailResponse
            {
                ProductId = x.ProductId,
                Name = x.Name,
                Sku = x.Sku,
                Price = x.Price,
                CategoryId = x.CategoryId,
                CategoryName = _db.Categories.Where(c => c.CategoryId == x.CategoryId).Select(c => c.Name).FirstOrDefault()!,
                IsActive = x.IsActive,
                CreatedAt = x.CreatedAt,
                OnHand = _db.Inventories.Where(i => i.ProductId == x.ProductId).Select(i => (int?)i.Quantity).FirstOrDefault() ?? 0
            })
            .FirstOrDefaultAsync(ct);

        return product == null ? NotFound() : Ok(product);
    }

    // POST /api/products
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] Product req, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(req.Name) || string.IsNullOrWhiteSpace(req.Sku))
            return BadRequest("Tên và SKU không được để trống.");

        if (await _db.Products.AnyAsync(p => p.Sku == req.Sku, ct))
            return BadRequest("SKU đã tồn tại.");

        req.ProductId = 0;
        req.IsActive = true;
        req.CreatedAt = DateTime.UtcNow;

        _db.Products.Add(req);
        await _db.SaveChangesAsync(ct);

        return CreatedAtAction(nameof(GetById), new { id = req.ProductId }, req);
    }

    // PUT /api/products/{id}
    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] Product req, CancellationToken ct = default)
    {
        var p = await _db.Products.FirstOrDefaultAsync(x => x.ProductId == id, ct);
        if (p == null) return NotFound();

        if (!string.IsNullOrWhiteSpace(req.Sku) &&
            await _db.Products.AnyAsync(x => x.Sku == req.Sku && x.ProductId != id, ct))
            return BadRequest("SKU đã tồn tại.");

        p.Name = string.IsNullOrWhiteSpace(req.Name) ? p.Name : req.Name;
        p.Sku = string.IsNullOrWhiteSpace(req.Sku) ? p.Sku : req.Sku;
        p.Price = req.Price;
        p.CategoryId = req.CategoryId;
        p.IsActive = req.IsActive == null ? p.IsActive : req.IsActive;

        await _db.SaveChangesAsync(ct);
        return Ok(p);
    }

    // DELETE /api/products/{id}  (soft delete)
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id, CancellationToken ct = default)
    {
        var p = await _db.Products.FirstOrDefaultAsync(x => x.ProductId == id, ct);
        if (p == null) return NotFound();

        p.IsActive = false;
        await _db.SaveChangesAsync(ct);

        return Ok(new { message = "Đã ngưng hoạt động sản phẩm." });
    }

    // PATCH /api/products/{id}/toggle  (bật/tắt nhanh trạng thái)
    [HttpPatch("{id:int}/toggle")]
    public async Task<IActionResult> ToggleActive(int id, CancellationToken ct = default)
    {
        var p = await _db.Products.FirstOrDefaultAsync(x => x.ProductId == id, ct);
        if (p == null) return NotFound();

        var current = p.IsActive == true;
        p.IsActive = !current;
        await _db.SaveChangesAsync(ct);

        return Ok(new { productId = p.ProductId, isActive = p.IsActive });
    }
}
