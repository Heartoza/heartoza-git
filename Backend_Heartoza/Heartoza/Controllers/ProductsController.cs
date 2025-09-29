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
        [FromQuery] List<int>? categoryIds,
        [FromQuery] string? q,
        [FromQuery] decimal? minPrice,
        [FromQuery] decimal? maxPrice,
        [FromQuery] bool? active,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? sort = "name",
        CancellationToken ct = default)
    {
        if (page <= 0) page = 1;
        if (pageSize <= 0 || pageSize > 100) pageSize = 20;

        var query = _db.Products.AsNoTracking().AsQueryable();

        // trạng thái
        query = active is null
            ? query.Where(p => p.IsActive == true)
            : query.Where(p => p.IsActive == active.Value);

        // category
        if (categoryId.HasValue)
            query = query.Where(p => p.CategoryId == categoryId.Value);
        if (categoryIds is { Count: > 0 })
            query = query.Where(p => categoryIds.Contains(p.CategoryId));

        // keyword
        if (!string.IsNullOrWhiteSpace(q))
        {
            var pattern = $"%{q.Trim()}%";
            query = query.Where(p => EF.Functions.Like(p.Name, pattern) ||
                                     EF.Functions.Like(p.Sku, pattern));
        }

        // price range
        if (minPrice.HasValue) query = query.Where(p => p.Price >= minPrice.Value);
        if (maxPrice.HasValue) query = query.Where(p => p.Price <= maxPrice.Value);

        // sort
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
            .ToListAsync(ct);

        return Ok(new { page, pageSize, total, totalPages, items });
    }

    // GET /api/products/{id}?includeInactive=false
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
                CategoryName = _db.Categories.Where(c => c.CategoryId == x.CategoryId)
                                             .Select(c => c.Name)
                                             .FirstOrDefault()!,
                IsActive = x.IsActive,
                CreatedAt = x.CreatedAt,
                OnHand = _db.Inventories.Where(i => i.ProductId == x.ProductId)
                                              .Select(i => (int?)i.Quantity)
                                              .FirstOrDefault() ?? 0
            })
            .FirstOrDefaultAsync(ct);

        return product == null ? NotFound() : Ok(product);
    }

    // POST /api/products  (Create) — dùng DTO gọn cho Swagger
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] ProductCreateDto req, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(req.Name)) return BadRequest("Tên sản phẩm không được để trống.");
        if (string.IsNullOrWhiteSpace(req.Sku)) return BadRequest("SKU không được để trống.");
        if (req.Price <= 0) return BadRequest("Giá phải > 0.");

        var sku = req.Sku.Trim();
        if (await _db.Products.AnyAsync(p => p.Sku == sku, ct))
            return BadRequest("SKU đã tồn tại.");

        var entity = new Product
        {
            Name = req.Name.Trim(),
            Sku = sku,
            Price = req.Price,
            CategoryId = req.CategoryId,
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };

        _db.Products.Add(entity);
        await _db.SaveChangesAsync(ct);

        var dto = new ProductDto
        {
            ProductId = entity.ProductId,
            Name = entity.Name,
            Sku = entity.Sku,
            Price = entity.Price,
            CategoryId = entity.CategoryId,
            IsActive = entity.IsActive,
            CreatedAt = entity.CreatedAt
        };

        return CreatedAtAction(nameof(GetById), new { id = entity.ProductId }, dto);
    }

    // PUT /api/products/{id} (partial update qua DTO nullable fields)
    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] ProductUpdateDto req, CancellationToken ct = default)
    {
        var p = await _db.Products.FirstOrDefaultAsync(x => x.ProductId == id, ct);
        if (p == null) return NotFound();

        // validate/uniqueness
        if (!string.IsNullOrWhiteSpace(req.Sku))
        {
            var sku = req.Sku.Trim();
            var exists = await _db.Products.AnyAsync(x => x.Sku == sku && x.ProductId != id, ct);
            if (exists) return BadRequest("SKU đã tồn tại.");
            p.Sku = sku;
        }

        if (req.Name != null)
        {
            if (string.IsNullOrWhiteSpace(req.Name))
                return BadRequest("Tên sản phẩm không được để trống.");
            p.Name = req.Name.Trim();
        }

        if (req.Price.HasValue)
        {
            if (req.Price.Value <= 0) return BadRequest("Giá phải > 0.");
            p.Price = req.Price.Value;
        }

        if (req.CategoryId.HasValue)
            p.CategoryId = req.CategoryId.Value;

        if (req.IsActive.HasValue)
            p.IsActive = req.IsActive.Value;

        await _db.SaveChangesAsync(ct);

        var dto = new ProductDto
        {
            ProductId = p.ProductId,
            Name = p.Name,
            Sku = p.Sku,
            Price = p.Price,
            CategoryId = p.CategoryId,
            IsActive = p.IsActive,
            CreatedAt = p.CreatedAt
        };

        return Ok(dto);
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

    // PATCH /api/products/{id}/toggle
    [HttpPatch("{id:int}/toggle")]
    public async Task<IActionResult> ToggleActive(int id, CancellationToken ct = default)
    {
        var p = await _db.Products.FirstOrDefaultAsync(x => x.ProductId == id, ct);
        if (p == null) return NotFound();

        p.IsActive = !(p.IsActive ?? true);
        await _db.SaveChangesAsync(ct);

        return Ok(new { productId = p.ProductId, isActive = p.IsActive });
    }


}
