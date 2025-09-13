// ProductsController
using Heartoza.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Linq;

[ApiController]
[Route("api/[controller]")]
public class ProductsController : ControllerBase
{
    private readonly GiftBoxShopContext _db;
    public ProductsController(GiftBoxShopContext db) => _db = db;

    // GET /api/products?categoryId=1&q=tra&page=1&pageSize=20&sort=name
    [HttpGet]
    public async Task<IActionResult> Get(
        [FromQuery] int? categoryId,
        [FromQuery] string? q,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? sort = "name",
        CancellationToken ct = default)
    {
        if (page <= 0) page = 1;
        if (pageSize <= 0 || pageSize > 100) pageSize = 20;

        // Lưu ý: IsActive trong DB có thể nullable -> so sánh == true
        var query = _db.Products
            .AsNoTracking()
            .Where(p => p.IsActive == true);

        if (categoryId.HasValue)
            query = query.Where(p => p.CategoryId == categoryId.Value);

        if (!string.IsNullOrWhiteSpace(q))
        {
            var pattern = $"%{q.Trim()}%";
            query = query.Where(p =>
                EF.Functions.Like(p.Name, pattern) ||
                EF.Functions.Like(p.Sku, pattern)); // SKU trong DB là VARCHAR(64) 'SKU'
        }

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
            items
        });
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id, CancellationToken ct = default)
    {
        var p = await _db.Products
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.ProductId == id && x.IsActive == true, ct);

        return p == null ? NotFound() : Ok(p);
    }
}
