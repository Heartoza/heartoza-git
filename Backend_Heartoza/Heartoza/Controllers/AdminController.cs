using Heartoza.DTO.Categories;
using Heartoza.DTO.Orders;
using Heartoza.DTO.Products;
using Heartoza.DTO.Users;
using Heartoza.Models;
using Heartoza.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Microsoft.Identity.Client.Extensions.Msal;

namespace Heartoza.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin")] // chỉ Admin
public class AdminController : ControllerBase
{
    private readonly IAvatarStorage _storage;               // tái dùng dịch vụ blob đã làm
    private readonly AzureStorageOptions _az;
    private readonly GiftBoxShopContext _db;
    public AdminController(GiftBoxShopContext db, IAvatarStorage storage, IOptions<AzureStorageOptions> az)
    {
        _db = db;
        _storage = storage;
        _az = az.Value;
    }
    // ========================== USER MANAGEMENT ==========================

    [HttpGet("users")]
    public async Task<IActionResult> GetUsers(
    [FromQuery] string? q,
    [FromQuery] string? role,
    [FromQuery] bool? active,
    [FromQuery] int page = 1,
    [FromQuery] int pageSize = 20,
    [FromQuery] string sort = "createdAt_desc")
    {
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 100);

        var query = _db.Users.AsNoTracking().AsQueryable();

        if (!string.IsNullOrWhiteSpace(q))
        {
            var like = q.Trim().ToLower();
            query = query.Where(u => (u.FullName ?? "").ToLower().Contains(like)
                                  || u.Email.ToLower().Contains(like));
        }
        if (!string.IsNullOrWhiteSpace(role))
            query = query.Where(u => u.Role == role);
        if (active.HasValue)
            query = query.Where(u => u.IsActive == active.Value);

        query = sort switch
        {
            "name_asc" => query.OrderBy(u => u.FullName).ThenBy(u => u.UserId),
            "name_desc" => query.OrderByDescending(u => u.FullName).ThenByDescending(u => u.UserId),
            "email_asc" => query.OrderBy(u => u.Email),
            "email_desc" => query.OrderByDescending(u => u.Email),
            "createdAt_asc" => query.OrderBy(u => u.CreatedAt),
            _ => query.OrderByDescending(u => u.CreatedAt)
        };

        var total = await query.CountAsync();
        var items = await query.Skip((page - 1) * pageSize).Take(pageSize)
            .Select(u => new {
                u.UserId,
                u.FullName,
                u.Email,
                u.Role,
                u.Phone,
                u.CreatedAt,
                u.IsActive,
                u.LastLoginAt
            })
            .ToListAsync();

        return Ok(new { page, pageSize, total, items });
    }


    [HttpPost("users/{id:int}/toggle")]
    public async Task<IActionResult> ToggleUser(int id)
    {
        var user = await _db.Users.FindAsync(id);
        if (user == null) return NotFound();

        user.IsActive = !user.IsActive; // ✅ đơn giản, đúng schema
        await _db.SaveChangesAsync();

        return Ok(new { user.UserId, user.Email, user.IsActive });
    }

    [HttpPut("users/{id:int}")]
    public async Task<IActionResult> UpdateUser(int id, [FromBody] AdminUpdateUserDto input)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u => u.UserId == id);
        if (user == null) return NotFound();

        // Chặn self-lock/self-demote (tránh khoá mất admin cuối)
        var currentIdStr = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        int.TryParse(currentIdStr, out var currentUserId);
        var isSelf = currentUserId != 0 && currentUserId == id;

        if (isSelf && input.IsActive == false)
            return BadRequest("Bạn không thể tự vô hiệu hoá tài khoản của chính mình.");
        if (!string.IsNullOrWhiteSpace(input.Role))
        {
            if (isSelf && !string.Equals(user.Role, input.Role, StringComparison.Ordinal))
                return BadRequest("Bạn không thể tự thay đổi role của chính mình.");
            if (input.Role is not ("Admin" or "Staff" or "Customer"))
                return BadRequest("Role không hợp lệ.");
            user.Role = input.Role;
        }

        if (input.FullName != null) user.FullName = input.FullName.Trim();
        if (input.Phone != null) user.Phone = input.Phone.Trim();
        if (input.IsActive.HasValue) user.IsActive = input.IsActive.Value;

        await _db.SaveChangesAsync();

        return Ok(new
        {
            user.UserId,
            user.Email,
            user.FullName,
            user.Phone,
            user.Role,
            user.IsActive,
            user.LastLoginAt,
            user.CreatedAt
        });
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
                CreatedAt = p.CreatedAt,
                OnHand = _db.Inventories.Where(i => i.ProductId == p.ProductId).Select(i => (int?)i.Quantity).FirstOrDefault() ?? 0
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
        if (req.Quantity < 0)
            return BadRequest("Số lượng không được âm.");

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

        // Create Inventory record
        var inventory = new Inventory
        {
            ProductId = prod.ProductId,
            Quantity = req.Quantity
        };
        _db.Inventories.Add(inventory);
        await _db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetProducts), new { id = prod.ProductId }, new
        {
            prod.ProductId,
            prod.Name,
            prod.Sku,
            prod.Price,
            OnHand = req.Quantity,
            prod.CategoryId,
            prod.IsActive,
            prod.CreatedAt
        });
    }


    // Sửa sản phẩm (input ProductDto)
    [HttpPut("products/{id:int}")]
    public async Task<IActionResult> UpdateProduct(int id, [FromBody] ProductUpdateDto req, CancellationToken ct = default)
    {
        // 1. Tìm sản phẩm trong database
        var prod = await _db.Products.FindAsync(new object[] { id }, ct);
        if (prod == null)
        {
            return NotFound();
        }

        // 2. Kiểm tra và chỉ cập nhật những trường có giá trị

        // Cập nhật Name nếu req.Name không phải là null
        if (req.Name != null)
        {
            prod.Name = req.Name.Trim();
        }

        // Cập nhật Sku nếu req.Sku không phải là null
        if (req.Sku != null)
        {
            var sku = req.Sku.Trim();
            // Kiểm tra xem SKU mới có bị trùng với sản phẩm khác không
            if (await _db.Products.AnyAsync(p => p.Sku == sku && p.ProductId != id, ct))
            {
                return BadRequest("SKU này đã tồn tại.");
            }
            prod.Sku = sku;
        }

        // Cập nhật Price nếu req.Price có giá trị
        if (req.Price.HasValue)
        {
            if (req.Price.Value <= 0) return BadRequest("Giá phải lớn hơn 0.");
            prod.Price = req.Price.Value;
        }

        // Cập nhật Quantity nếu req.Quantity có giá trị
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

        // Cập nhật CategoryId nếu req.CategoryId có giá trị
        if (req.CategoryId.HasValue)
        {
            prod.CategoryId = req.CategoryId.Value;
        }

        // Cập nhật IsActive nếu req.IsActive có giá trị
        if (req.IsActive.HasValue)
        {
            prod.IsActive = req.IsActive.Value;
        }

        // 3. Lưu thay đổi vào database
        await _db.SaveChangesAsync(ct);

        // 4. Trả về DTO thay vì Entity để tránh circular reference
        var onHand = await _db.Inventories
            .Where(i => i.ProductId == id)
            .Select(i => (int?)i.Quantity)
            .FirstOrDefaultAsync(ct) ?? 0;

        return Ok(new ProductDto
        {
            ProductId = prod.ProductId,
            Name = prod.Name,
            Sku = prod.Sku,
            Price = prod.Price,
            CategoryId = prod.CategoryId,
            IsActive = prod.IsActive,
            CreatedAt = prod.CreatedAt,
            OnHand = onHand
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
    // GET /api/admin/orders/{id}
    [HttpGet("orders/{id:int}")]
    public async Task<IActionResult> GetById(int id, CancellationToken ct)
    {
        var order = await _db.Orders
            .AsNoTracking()
            .Where(o => o.OrderId == id)
            .Select(o => new OrderResponse
            {
                OrderId = o.OrderId,
                OrderCode = o.OrderCode ?? string.Empty,
                UserId = o.UserId,
                ShippingAddressId = o.ShippingAddressId,
                Subtotal = o.Subtotal,
                ShippingFee = o.ShippingFee ?? 0m,
                GrandTotal = o.GrandTotal,
                Status = o.Status ?? "Pending",
                CreatedAt = o.CreatedAt,
                Comment = o.Comment,
                Items = o.OrderItems.Select(oi => new OrderItemResponse
                {
                    OrderItemId = oi.OrderItemId,
                    ProductId = oi.ProductId,
                    ProductName = oi.Product != null ? oi.Product.Name : null,
                    Sku = oi.Product != null ? oi.Product.Sku : null,
                    Quantity = oi.Quantity,
                    UnitPrice = oi.UnitPrice,
                    LineTotal = oi.LineTotal ?? (oi.UnitPrice * oi.Quantity)
                }).ToList(),
                Payments = o.Payments.Select(p => new PaymentResponse
                {
                    PaymentId = p.PaymentId,
                    Amount = p.Amount,
                    Method = p.Method ?? "COD",
                    Status = p.Status ?? "Pending",
                    CreatedAt = p.CreatedAt
                }).ToList(),
                Shipments = o.Shipments.Select(s => new ShipmentResponse
                {
                    ShipmentId = s.ShipmentId,
                    Carrier = s.Carrier,
                    TrackingCode = s.TrackingCode,
                    Status = s.Status ?? "Packing",
                    CreatedAt = s.CreatedAt
                }).ToList()
            })
            .FirstOrDefaultAsync(ct);

        if (order == null) return NotFound(new { message = "Order not found" });
        return Ok(order);
    }

    [HttpGet("products/{id:int}/images")]
    public async Task<IActionResult> GetProductImages(int id, CancellationToken ct)
    {
        var images = await _db.ProductMedia
            .AsNoTracking()
            .Where(pm => pm.ProductId == id)
            .OrderByDescending(pm => pm.IsPrimary)
            .ThenBy(pm => pm.SortOrder)
            .Select(pm => new {
                pm.ProductMediaId,
                pm.MediaId,
                pm.IsPrimary,
                pm.SortOrder,
                BlobPath = pm.Media.BlobPath
            })
            .ToListAsync(ct);

        // cấp SAS 10'
        var result = images.Select(x =>
        {
            string url;
            try
            {
                if (_storage is BlobAvatarStorage blobSvc && !string.IsNullOrWhiteSpace(x.BlobPath))
                    url = blobSvc.GenerateReadSasUrl(x.BlobPath, 10);
                else
                    url = $"{(_az.BaseUrl ?? "").TrimEnd('/')}/{x.BlobPath}";
            }
            catch
            {
                url = $"{(_az.BaseUrl ?? "").TrimEnd('/')}/{x.BlobPath}";
            }
            return new { x.ProductMediaId, x.MediaId, x.IsPrimary, x.SortOrder, Url = url };
        });

        return Ok(result);
    }
    [HttpPost("products/{id:int}/images")]
    [Consumes("multipart/form-data")]
    [RequestSizeLimit(10_000_000)]
    public async Task<IActionResult> UploadProductImage(int id, [FromForm] ProductImageUploadRequest req, CancellationToken ct)
    {
        var prod = await _db.Products.FindAsync(new object[] { id }, ct);
        if (prod == null) return NotFound("Product not found");

        if (req.file == null || req.file.Length == 0) return BadRequest("Không có file.");
        var allowed = new[] { "image/png", "image/jpeg", "image/webp" };
        var mime = (req.file.ContentType ?? "").ToLowerInvariant();
        if (!allowed.Contains(mime)) return BadRequest("Định dạng ảnh không hỗ trợ.");

        await using var s = req.file.OpenReadStream();
        var uploadedUrl = await _storage.UploadAsync(s, mime, req.file.FileName, ct);
        var blobName = Path.GetFileName(new Uri(uploadedUrl).AbsolutePath);

        var media = new Medium
        {
            Container = _az.Container ?? "avatars", // hoặc product-images nếu anh tách
            BlobPath = blobName,
            FileName = req.file.FileName,
            ContentType = mime,
            ByteSize = req.file.Length,
            SourceType = "blob",
            ExternalUrl = null,
            Status = "imported",
            CreatedAt = DateTime.UtcNow
        };
        _db.Media.Add(media);
        await _db.SaveChangesAsync(ct);

        if (req.AsPrimary)
        {
            var all = _db.ProductMedia.Where(pm => pm.ProductId == id);
            await all.ForEachAsync(pm => pm.IsPrimary = false, ct);
        }

        var link = new ProductMedium
        {
            ProductId = id,
            MediaId = media.MediaId,
            IsPrimary = req.AsPrimary,
            SortOrder = 0,
            CreatedAt = DateTime.UtcNow
        };
        _db.ProductMedia.Add(link);
        await _db.SaveChangesAsync(ct);

        // trả SAS 10'
        string url;
        try
        {
            if (_storage is BlobAvatarStorage blobSvc)
                url = blobSvc.GenerateReadSasUrl(media.BlobPath, 10);
            else
                url = $"{(_az.BaseUrl ?? "").TrimEnd('/')}/{media.BlobPath}";
        }
        catch
        {
            url = $"{(_az.BaseUrl ?? "").TrimEnd('/')}/{media.BlobPath}";
        }

        return Ok(new { message = "Đã thêm ảnh sản phẩm.", productMediaId = link.ProductMediaId, mediaId = media.MediaId, url });
    }

    [HttpPost("products/{id:int}/images/set-primary")]
    public async Task<IActionResult> SetPrimaryProductImage(int id, [FromBody] ProductSetPrimaryReq req, CancellationToken ct)
    {
        var link = await _db.ProductMedia.FirstOrDefaultAsync(pm => pm.ProductId == id && pm.ProductMediaId == req.ProductMediaId, ct);
        if (link == null) return NotFound("Ảnh không thuộc sản phẩm này.");

        var all = _db.ProductMedia.Where(pm => pm.ProductId == id);
        await all.ForEachAsync(pm => pm.IsPrimary = false, ct);

        link.IsPrimary = true;
        await _db.SaveChangesAsync(ct);

        return Ok(new { message = "Đã đặt ảnh chính." });
    }

    [HttpDelete("products/{id:int}/images/{productMediaId:long}")]
    public async Task<IActionResult> DeleteProductImage(int id, long productMediaId, CancellationToken ct)
    {
        var link = await _db.ProductMedia.FirstOrDefaultAsync(pm => pm.ProductId == id && pm.ProductMediaId == productMediaId, ct);
        if (link == null) return NotFound();

        var mediaId = link.MediaId;

        _db.ProductMedia.Remove(link);
        await _db.SaveChangesAsync(ct);

        var stillUsed = await _db.ProductMedia.AnyAsync(pm => pm.MediaId == mediaId, ct);
        if (!stillUsed)
        {
            var m = await _db.Media.FirstOrDefaultAsync(x => x.MediaId == mediaId, ct);
            if (m != null)
            {
                try { await _storage.DeleteAsync(m.BlobPath, ct); } catch { /* ignore */ }
                _db.Attach(m);
                _db.Media.Remove(m);
                await _db.SaveChangesAsync(ct);
            }
        }

        return Ok(new { message = "Đã xoá ảnh." });
    }

    [HttpPatch("products/{id:int}/images/reorder")]
    public async Task<IActionResult> ReorderImages(int id, [FromBody] ReorderRequest req, CancellationToken ct)
    {
        var ids = req.Items.Select(x => x.ProductMediaId).ToHashSet();
        var links = await _db.ProductMedia.Where(pm => pm.ProductId == id && ids.Contains(pm.ProductMediaId)).ToListAsync(ct);
        if (links.Count != ids.Count) return BadRequest("Danh sách không hợp lệ.");

        foreach (var l in links)
        {
            l.SortOrder = req.Items.First(x => x.ProductMediaId == l.ProductMediaId).SortOrder;
        }
        await _db.SaveChangesAsync(ct);
        return Ok(new { message = "Đã sắp xếp lại thứ tự ảnh." });
    }
}
