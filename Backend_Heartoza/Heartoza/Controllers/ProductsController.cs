using Heartoza.DTO.Products;
using Heartoza.Models;
using Heartoza.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

[ApiController]
[Route("api/[controller]")]
public class ProductsController : ControllerBase
{
    private readonly IAvatarStorage _storage;
    private readonly AzureStorageOptions _az;
    private readonly GiftBoxShopContext _db;
    public ProductsController(GiftBoxShopContext db, IAvatarStorage storage, IOptions<AzureStorageOptions> az)
    {
        _db = db;
        _storage = storage;
        _az = az.Value;
    }

    private string BuildImageUrl(string? blobPath, int minutes = 10)
    {
        if (string.IsNullOrWhiteSpace(blobPath))
            return string.Empty;

        try
        {
            if (_storage is BlobAvatarStorage blobSvc)
                return blobSvc.GenerateReadSasUrl(blobPath, minutes);
        }
        catch
        {
            // ignore
        }
        // fallback khi container public hoặc không tạo được SAS
        return $"{(_az.BaseUrl ?? "").TrimEnd('/')}/{blobPath}".Replace("//", "/");
    }

    // GET /api/products ...
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

        query = active is null ? query.Where(p => p.IsActive == true)
                               : query.Where(p => p.IsActive == active.Value);

        if (categoryId.HasValue)
            query = query.Where(p => p.CategoryId == categoryId.Value);
        if (categoryIds is { Count: > 0 })
            query = query.Where(p => categoryIds.Contains(p.CategoryId));

        if (!string.IsNullOrWhiteSpace(q))
        {
            var pattern = $"%{q.Trim()}%";
            query = query.Where(p => EF.Functions.Like(p.Name, pattern) ||
                                     EF.Functions.Like(p.Sku, pattern));
        }

        if (minPrice.HasValue) query = query.Where(p => p.Price >= minPrice.Value);
        if (maxPrice.HasValue) query = query.Where(p => p.Price <= maxPrice.Value);

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

        // Lấy thêm primaryBlobPath để build URL bên ngoài DB
        var rows = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(p => new
            {
                p.ProductId,
                p.Name,
                p.Sku,
                p.Price,
                p.CategoryId,
                p.IsActive,
                p.CreatedAt,
                OnHand = _db.Inventories.Where(i => i.ProductId == p.ProductId).Select(i => (int?)i.Quantity).FirstOrDefault() ?? 0,
                PrimaryBlobPath = _db.ProductMedia
                    .Where(pm => pm.ProductId == p.ProductId)
                    .OrderByDescending(pm => pm.IsPrimary)
                    .ThenBy(pm => pm.SortOrder)
                    .Select(pm => pm.Media.BlobPath)
                    .FirstOrDefault()
            })
            .ToListAsync(ct);

        var items = rows.Select(r => new ProductDto
        {
            ProductId = r.ProductId,
            Name = r.Name,
            Sku = r.Sku,
            Price = r.Price,
            OnHand = r.OnHand,
            CategoryId = r.CategoryId,
            IsActive = r.IsActive,
            CreatedAt = r.CreatedAt,
            // cần property mới trong DTO:
            ThumbnailUrl = BuildImageUrl(r.PrimaryBlobPath, 10)
        }).ToList();

        return Ok(new { page, pageSize, total, totalPages, items });
    }


    // GET /api/products/{id}
    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id, [FromQuery] bool includeInactive = false, CancellationToken ct = default)
    {
        // lấy info cơ bản
        var core = await _db.Products
            .AsNoTracking()
            .Where(x => x.ProductId == id && (includeInactive || x.IsActive == true))
            .Select(x => new
            {
                x.ProductId,
                x.Name,
                x.Sku,
                x.Price,
                x.CategoryId,
                CategoryName = _db.Categories.Where(c => c.CategoryId == x.CategoryId).Select(c => c.Name).FirstOrDefault()!,
                x.IsActive,
                x.CreatedAt,
                OnHand = _db.Inventories.Where(i => i.ProductId == x.ProductId).Select(i => (int?)i.Quantity).FirstOrDefault() ?? 0,
                PrimaryBlobPath = _db.ProductMedia
                    .Where(pm => pm.ProductId == x.ProductId)
                    .OrderByDescending(pm => pm.IsPrimary)
                    .ThenBy(pm => pm.SortOrder)
                    .Select(pm => pm.Media.BlobPath)
                    .FirstOrDefault()
            })
            .FirstOrDefaultAsync(ct);

        if (core == null) return NotFound();

        // lấy list ảnh
        var imgs = await _db.ProductMedia
            .AsNoTracking()
            .Where(pm => pm.ProductId == id)
            .OrderByDescending(pm => pm.IsPrimary)
            .ThenBy(pm => pm.SortOrder)
            .Select(pm => new
            {
                pm.ProductMediaId,
                pm.MediaId,
                pm.IsPrimary,
                pm.SortOrder,
                BlobPath = pm.Media.BlobPath
            })
            .ToListAsync(ct);

        var dto = new ProductDetailResponse
        {
            ProductId = core.ProductId,
            Name = core.Name,
            Sku = core.Sku,
            Price = core.Price,
            CategoryId = core.CategoryId,
            CategoryName = core.CategoryName,
            IsActive = core.IsActive,
            CreatedAt = core.CreatedAt,
            OnHand = core.OnHand,

            // thêm 2 field mới:
            PrimaryImageUrl = BuildImageUrl(core.PrimaryBlobPath, 10),
            Images = imgs.Select(i => new ProductImageItem
            {
                ProductMediaId = i.ProductMediaId,
                MediaId = i.MediaId,
                IsPrimary = i.IsPrimary,
                SortOrder = i.SortOrder,
                Url = BuildImageUrl(i.BlobPath, 10)
            }).ToList()
        };

        return Ok(dto);
    }


    // POST /api/products  (Create) — dùng DTO gọn cho Swagger
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] ProductCreateDto req, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(req.Name)) return BadRequest("Tên sản phẩm không được để trống.");
        if (string.IsNullOrWhiteSpace(req.Sku)) return BadRequest("SKU không được để trống.");
        if (req.Price <= 0) return BadRequest("Giá phải > 0.");
        if (req.Quantity < 0) return BadRequest("Số lượng không được âm.");

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

        // Create Inventory record
        var inventory = new Inventory
        {
            ProductId = entity.ProductId,
            Quantity = req.Quantity
        };
        _db.Inventories.Add(inventory);
        await _db.SaveChangesAsync(ct);

        var dto = new ProductDto
        {
            ProductId = entity.ProductId,
            Name = entity.Name,
            Sku = entity.Sku,
            Price = entity.Price,
            OnHand = req.Quantity,
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

        if (req.Quantity.HasValue)
        {
            if (req.Quantity.Value < 0) return BadRequest("Số lượng không được âm.");
            
            // Update or create Inventory
            var inventory = await _db.Inventories.FirstOrDefaultAsync(i => i.ProductId == id, ct);
            if (inventory != null)
            {
                inventory.Quantity = req.Quantity.Value;
            }
            else
            {
                _db.Inventories.Add(new Inventory
                {
                    ProductId = id,
                    Quantity = req.Quantity.Value
                });
            }
        }

        if (req.CategoryId.HasValue)
            p.CategoryId = req.CategoryId.Value;

        if (req.IsActive.HasValue)
            p.IsActive = req.IsActive.Value;

        await _db.SaveChangesAsync(ct);

        var onHand = await _db.Inventories
            .Where(i => i.ProductId == id)
            .Select(i => (int?)i.Quantity)
            .FirstOrDefaultAsync(ct) ?? 0;

        var dto = new ProductDto
        {
            ProductId = p.ProductId,
            Name = p.Name,
            Sku = p.Sku,
            Price = p.Price,
            OnHand = onHand,
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

    // GET /api/products/search?q=tra
    [HttpGet("search")]
    public async Task<IActionResult> Search([FromQuery] string q, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(q))
            return BadRequest(new { message = "Vui lòng nhập từ khóa tìm kiếm." });

        var pattern = $"%{q.Trim()}%";

        var results = await _db.Products
            .AsNoTracking()
            .Where(p => !string.IsNullOrEmpty(p.Name) && EF.Functions.Like(p.Name, pattern) && p.IsActive == true)
            .OrderBy(p => p.Name)
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

        return Ok(new
        {
            total = results.Count,
            items = results
        });
    }

    // TOP-SELLING: trả cả thumbnailUrl giống các endpoint khác
    [HttpGet("top-selling")]
    public async Task<IActionResult> GetTopSellingProducts(
        [FromQuery] int top = 5,
        CancellationToken ct = default)
    {
        // Top N theo số lượng bán
        var rows = await _db.OrderItems
            .GroupBy(oi => oi.ProductId)
            .Select(g => new
            {
                ProductId = g.Key,
                TotalSold = g.Sum(x => x.Quantity)
            })
            .OrderByDescending(x => x.TotalSold)
            .Take(top)
            .Join(
                _db.Products.AsNoTracking().Where(p => p.IsActive == true),
                g => g.ProductId,
                p => p.ProductId,
                (g, p) => new
                {
                    p.ProductId,
                    p.Sku,
                    p.Name,
                    p.Price,
                    g.TotalSold,
                    // lấy blob path ảnh chính để build URL
                    PrimaryBlobPath = _db.ProductMedia
                        .Where(pm => pm.ProductId == p.ProductId)
                        .OrderByDescending(pm => pm.IsPrimary)
                        .ThenBy(pm => pm.SortOrder)
                        .Select(pm => pm.Media.BlobPath)
                        .FirstOrDefault()
                }
            )
            .ToListAsync(ct);

        // Build ra payload chuẩn có thumbnailUrl
        var result = rows.Select(r => new
        {
            r.ProductId,
            r.Sku,
            name = r.Name,
            price = r.Price,
            totalSold = r.TotalSold,
            thumbnailUrl = BuildImageUrl(r.PrimaryBlobPath, 10) // <-- giống ProductList
        });

        return Ok(result);
    }

}
