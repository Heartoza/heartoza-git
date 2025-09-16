using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Heartoza.Dtos.Orders;
using Heartoza.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Heartoza.Controllers;

[ApiController]
[Route("api/[controller]")]
public class OrdersController : ControllerBase
{
    private readonly GiftBoxShopContext _db;
    public OrdersController(GiftBoxShopContext db) => _db = db;

    // POST /api/orders
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateOrderRequest req, CancellationToken ct)
    {
        if (req?.Items == null || req.Items.Count == 0)
            return BadRequest("Thiếu danh sách sản phẩm.");
        if (req.Items.Any(i => i.ProductId <= 0 || i.Quantity <= 0))
            return BadRequest("Mỗi item phải có ProductId hợp lệ và Quantity > 0.");
        if (req.ShippingFee < 0)
            return BadRequest("ShippingFee không được âm.");

        // 1) Lấy CategoryId "Hộp quà"
        var giftBoxCatId = await _db.Categories
            .AsNoTracking()
            .Where(c => c.Name == "Hộp quà")
            .Select(c => c.CategoryId)
            .FirstOrDefaultAsync(ct);
        if (giftBoxCatId == 0)
            return BadRequest("Thiếu danh mục 'Hộp quà'.");

        // 2) Gom items theo ProductId
        var itemGroups = req.Items
            .GroupBy(i => i.ProductId)
            .Select(g => new { ProductId = g.Key, Quantity = g.Sum(x => x.Quantity) })
            .ToList();

        var pids = itemGroups.Select(x => x.ProductId).ToList();

        // 3) Lấy products active
        var products = await _db.Products
            .AsNoTracking()
            .Where(p => p.IsActive == true && pids.Contains(p.ProductId))
            .Select(p => new
            {
                p.ProductId,
                p.CategoryId,
                Price = (decimal?)p.Price
            })
            .ToListAsync(ct);
        if (products.Count != pids.Count)
            return BadRequest("Có sản phẩm không tồn tại hoặc không hoạt động.");

        // 4) Rule: phải có ít nhất 1 sản phẩm thuộc 'Hộp quà'
        if (!products.Any(p => p.CategoryId == giftBoxCatId))
            return BadRequest("Đơn hàng phải có ít nhất 1 sản phẩm thuộc danh mục 'Hộp quà'.");

        // (Tuỳ chọn) Ràng buộc địa chỉ thuộc user
        // var okAddr = await _db.Addresses.AnyAsync(a => a.AddressId == req.ShippingAddressId && a.UserId == req.UserId, ct);
        // if (!okAddr) return BadRequest("Địa chỉ không thuộc user.");

        // 5) Kiểm tra tồn kho
        var invRows = await _db.Inventories
            .Where(i => pids.Contains(i.ProductId))
            .ToListAsync(ct);
        var invMap = invRows.ToDictionary(i => i.ProductId, i => i);

        foreach (var g in itemGroups)
        {
            if (!invMap.TryGetValue(g.ProductId, out var invRow))
                return BadRequest($"Sản phẩm {g.ProductId} chưa có dòng tồn kho.");
            var onHand = (int?)invRow.Quantity;
            if (onHand.GetValueOrDefault() < g.Quantity)
                return BadRequest($"Sản phẩm {g.ProductId} không đủ hàng (tồn: {onHand.GetValueOrDefault()}, cần: {g.Quantity}).");
        }

        // 6) Tính tiền
        decimal subtotal = 0m;
        foreach (var g in itemGroups)
        {
            var price = products.First(p => p.ProductId == g.ProductId).Price.GetValueOrDefault(0m);
            subtotal += price * g.Quantity;
        }
        decimal grand = subtotal + req.ShippingFee;

        // 7) Giao dịch
        await using var tx = await _db.Database.BeginTransactionAsync(ct);
        try
        {
            var nowUtc = DateTime.UtcNow;

            var order = new Order
            {
                OrderCode = $"GBX-{nowUtc:yyyyMMddHHmmssfff}",
                UserId = req.UserId > 0 ? req.UserId : 1,
                ShippingAddressId = req.ShippingAddressId,
                Subtotal = subtotal,
                ShippingFee = req.ShippingFee,
                GrandTotal = grand,
                Status = "Pending",
                CreatedAt = nowUtc
            };
            _db.Orders.Add(order);
            await _db.SaveChangesAsync(ct);

            foreach (var g in itemGroups)
            {
                var prod = products.First(p => p.ProductId == g.ProductId);
                var unit = prod.Price.GetValueOrDefault(0m);

                _db.OrderItems.Add(new OrderItem
                {
                    OrderId = order.OrderId,
                    ProductId = prod.ProductId,
                    Quantity = g.Quantity,
                    UnitPrice = unit
                });

                var invRow = invMap[g.ProductId];
                if (invRow.GetType().GetProperty("Quantity")!.PropertyType == typeof(int?))
                {
                    var q = (int?)invRow.Quantity;
                    invRow.Quantity = q.GetValueOrDefault() - g.Quantity;
                }
                else
                {
                    invRow.Quantity -= g.Quantity;
                }

                var remain = (int?)invRow.Quantity;
                if (remain.GetValueOrDefault() < 0)
                    return BadRequest($"Sản phẩm {g.ProductId} bị âm tồn sau khi trừ.");
            }

            _db.Payments.Add(new Payment
            {
                OrderId = order.OrderId,
                Amount = grand,
                Method = string.IsNullOrWhiteSpace(req.Method) ? "COD" : req.Method!,
                Status = "Pending",
                CreatedAt = nowUtc
            });

            _db.Shipments.Add(new Shipment
            {
                OrderId = order.OrderId,
                Carrier = null,
                TrackingCode = null,
                Status = "Packing",
                CreatedAt = nowUtc
            });

            await _db.SaveChangesAsync(ct);
            await tx.CommitAsync(ct);

            return CreatedAtAction(nameof(GetById),
                new { id = order.OrderId },
                new { order.OrderId, order.OrderCode, order.GrandTotal });
        }
        catch
        {
            await tx.RollbackAsync(ct);
            throw;
        }
    }

    // GET /api/orders (list + filter/paging/sort)
    [HttpGet]
    public async Task<IActionResult> GetList(
        [FromQuery] int? userId,
        [FromQuery] string? status,
        [FromQuery] string? q,
        [FromQuery] DateTime? dateFrom,
        [FromQuery] DateTime? dateTo,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? sort = "-created",
        CancellationToken ct = default)
    {
        if (page <= 0) page = 1;
        if (pageSize <= 0 || pageSize > 100) pageSize = 20;

        var query = _db.Orders.AsNoTracking().AsQueryable();

        if (userId.HasValue) query = query.Where(o => o.UserId == userId.Value);
        if (!string.IsNullOrWhiteSpace(status)) query = query.Where(o => o.Status == status);
        if (!string.IsNullOrWhiteSpace(q))
        {
            var pattern = $"%{q.Trim()}%";
            query = query.Where(o => EF.Functions.Like(o.OrderCode, pattern));
        }
        if (dateFrom.HasValue) query = query.Where(o => o.CreatedAt >= dateFrom.Value);
        if (dateTo.HasValue) query = query.Where(o => o.CreatedAt < dateTo.Value);

        query = sort?.ToLowerInvariant() switch
        {
            "created" => query.OrderBy(o => o.CreatedAt),
            "-created" => query.OrderByDescending(o => o.CreatedAt),
            "total" => query.OrderBy(o => o.GrandTotal),
            "-total" => query.OrderByDescending(o => o.GrandTotal),
            "code" => query.OrderBy(o => o.OrderCode),
            "-code" => query.OrderByDescending(o => o.OrderCode),
            _ => query.OrderByDescending(o => o.CreatedAt)
        };

        var total = await query.CountAsync(ct);

        var items = await query
            .Skip((page - 1) * pageSize).Take(pageSize)
            .Select(o => new OrderListItemResponse
            {
                OrderId = o.OrderId,
                OrderCode = o.OrderCode ?? string.Empty,
                UserId = o.UserId,
                Status = o.Status ?? "Pending",
                GrandTotal = o.GrandTotal,
                CreatedAt = o.CreatedAt
            })
            .ToListAsync(ct);

        return Ok(new PagedResponse<OrderListItemResponse>
        {
            Page = page,
            PageSize = pageSize,
            Total = total,
            Items = items
        });
    }

    // GET /api/orders/{id}
    [HttpGet("{id:int}")]
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
                ShippingFee = o.ShippingFee.GetValueOrDefault(0m),
                GrandTotal = o.GrandTotal,
                Status = o.Status ?? "Pending",
                CreatedAt = o.CreatedAt,
                Items = o.OrderItems.Select(oi => new OrderItemResponse
                {
                    OrderItemId = oi.OrderItemId,
                    ProductId = oi.ProductId,
                    ProductName = oi.Product != null ? oi.Product.Name : null,
                    Sku = oi.Product != null ? oi.Product.Sku : null,
                    Quantity = oi.Quantity,
                    UnitPrice = oi.UnitPrice,
                    LineTotal = (oi.LineTotal ?? (oi.UnitPrice * oi.Quantity))
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

        if (order == null) return NotFound();
        return Ok(order);
    }

    // PATCH /api/orders/{id}/cancel
    [HttpPatch("{id:int}/cancel")]
    public async Task<IActionResult> Cancel(int id, [FromBody] CancelOrderRequest req, CancellationToken ct = default)
    {
        await using var tx = await _db.Database.BeginTransactionAsync(ct);

        var order = await _db.Orders
            .Include(o => o.OrderItems)
            .FirstOrDefaultAsync(o => o.OrderId == id, ct);

        if (order == null) return NotFound();
        if (order.Status is not ("Pending" or "Packing"))
            return BadRequest("Trạng thái hiện tại không cho phép hủy.");

        // Restock
        var pids = order.OrderItems.Select(i => i.ProductId).Distinct().ToList();
        var invRows = await _db.Inventories.Where(i => pids.Contains(i.ProductId)).ToListAsync(ct);
        var invMap = invRows.ToDictionary(i => i.ProductId, i => i);

        foreach (var oi in order.OrderItems)
        {
            if (invMap.TryGetValue(oi.ProductId, out var inv))
                inv.Quantity = (int?)inv.Quantity is int q ? q + oi.Quantity : oi.Quantity;
        }

        order.Status = "Cancelled";
        await _db.SaveChangesAsync(ct);
        await tx.CommitAsync(ct);

        return Ok(new { message = "Đã hủy đơn và trả tồn kho.", orderId = order.OrderId, reason = req?.Reason });
    }

    // POST /api/orders/{id}/payments/confirm
    [HttpPost("{id:int}/payments/confirm")]
    public async Task<IActionResult> ConfirmPayment(int id, [FromBody] ConfirmPaymentRequest req, CancellationToken ct = default)
    {
        await using var tx = await _db.Database.BeginTransactionAsync(ct);

        var order = await _db.Orders
            .Include(o => o.Payments)
            .FirstOrDefaultAsync(o => o.OrderId == id, ct);

        if (order == null) return NotFound();

        foreach (var p in order.Payments)
        {
            p.Status = "Success";
            p.Method = string.IsNullOrWhiteSpace(req?.Method) ? (p.Method ?? "COD") : req!.Method!;
            p.CreatedAt ??= DateTime.UtcNow;
        }

        order.Status = "Paid";
        await _db.SaveChangesAsync(ct);
        await tx.CommitAsync(ct);

        return Ok(new { message = "Đã xác nhận thanh toán.", orderId = order.OrderId });
    }

    // POST /api/orders/{id}/shipments/update
    [HttpPost("{id:int}/shipments/update")]
    public async Task<IActionResult> UpdateShipment(int id, [FromBody] UpdateShipmentRequest req, CancellationToken ct = default)
    {
        if (req == null) return BadRequest("Thiếu payload.");

        var shipment = await _db.Shipments.FirstOrDefaultAsync(s => s.OrderId == id, ct);
        if (shipment == null)
        {
            shipment = new Shipment
            {
                OrderId = id,
                Carrier = req.Carrier,
                TrackingCode = req.TrackingCode,
                Status = string.IsNullOrWhiteSpace(req.Status) ? "Packing" : req.Status!,
                CreatedAt = DateTime.UtcNow
            };
            _db.Shipments.Add(shipment);
        }
        else
        {
            shipment.Carrier = req.Carrier ?? shipment.Carrier;
            shipment.TrackingCode = req.TrackingCode ?? shipment.TrackingCode;
            shipment.Status = string.IsNullOrWhiteSpace(req.Status) ? (shipment.Status ?? "Packing") : req.Status!;
        }

        await _db.SaveChangesAsync(ct);
        return Ok(new { message = "Đã cập nhật vận chuyển.", orderId = id });
    }

    [HttpPost("quote")]
    public async Task<IActionResult> Quote([FromBody] QuoteOrderRequest req, CancellationToken ct = default)
    {
        if (req?.Items == null || req.Items.Count == 0)
            return BadRequest("Thiếu danh sách sản phẩm.");
        if (req.Items.Any(i => i.ProductId <= 0 || i.Quantity <= 0))
            return BadRequest("Mỗi item phải có ProductId hợp lệ và Quantity > 0.");
        if (req.ShippingFee < 0)
            return BadRequest("ShippingFee không được âm.");

        var giftBoxCatId = await _db.Categories
            .AsNoTracking()
            .Where(c => c.Name == "Hộp quà")
            .Select(c => c.CategoryId)
            .FirstOrDefaultAsync(ct);
        if (giftBoxCatId == 0)
            return BadRequest("Thiếu danh mục 'Hộp quà'.");

        var groups = req.Items
            .GroupBy(i => i.ProductId)
            .Select(g => new { ProductId = g.Key, Quantity = g.Sum(x => x.Quantity) })
            .ToList();

        var pids = groups.Select(g => g.ProductId).ToList();

        var products = await _db.Products
            .AsNoTracking()
            .Where(p => p.IsActive == true && pids.Contains(p.ProductId))
            .Select(p => new { p.ProductId, p.CategoryId, Price = (decimal?)p.Price, p.Name, p.Sku })
            .ToListAsync(ct);

        var notFound = pids.Except(products.Select(p => p.ProductId)).ToList();
        var hasGiftBox = products.Any(p => p.CategoryId == giftBoxCatId);

        var inv = await _db.Inventories
            .AsNoTracking()
            .Where(i => pids.Contains(i.ProductId))
            .ToListAsync(ct);
        var invMap = inv.ToDictionary(i => i.ProductId, i => (int?)i.Quantity);

        var stockIssues = new List<QuoteStockIssue>();
        foreach (var g in groups)
        {
            var onHand = invMap.TryGetValue(g.ProductId, out var q) ? q.GetValueOrDefault() : 0;
            if (onHand < g.Quantity)
            {
                var prod = products.FirstOrDefault(p => p.ProductId == g.ProductId);
                stockIssues.Add(new QuoteStockIssue
                {
                    ProductId = g.ProductId,
                    Requested = g.Quantity,
                    Available = onHand,
                    ProductName = prod?.Name,
                    Sku = prod?.Sku
                });
            }
        }

        decimal subtotal = 0m;
        foreach (var g in groups)
        {
            var price = products.FirstOrDefault(p => p.ProductId == g.ProductId)?.Price.GetValueOrDefault(0m) ?? 0m;
            subtotal += price * g.Quantity;
        }
        var shipping = req.ShippingFee;
        var grand = subtotal + shipping;

        return Ok(new QuoteOrderResponse
        {
            Subtotal = subtotal,
            ShippingFee = shipping,
            GrandTotal = grand,
            HasGiftBox = hasGiftBox,
            MissingProductIds = notFound,
            StockIssues = stockIssues
        });
    }
    [HttpGet("by-code/{code}")]
    public async Task<IActionResult> GetByCode(string code, CancellationToken ct = default)
    {
        code = code?.Trim() ?? string.Empty;
        if (string.IsNullOrEmpty(code)) return BadRequest("Thiếu mã đơn.");

        // Tái sử dụng projection DTO để tránh vòng tham chiếu
        var order = await _db.Orders
            .AsNoTracking()
            .Where(o => o.OrderCode == code)
            .Select(o => new OrderResponse
            {
                OrderId = o.OrderId,
                OrderCode = o.OrderCode ?? string.Empty,
                UserId = o.UserId,
                ShippingAddressId = o.ShippingAddressId,
                Subtotal = o.Subtotal,
                ShippingFee = o.ShippingFee.GetValueOrDefault(0m),
                GrandTotal = o.GrandTotal,
                Status = o.Status ?? "Pending",
                CreatedAt = o.CreatedAt,
                Items = o.OrderItems.Select(oi => new OrderItemResponse
                {
                    OrderItemId = oi.OrderItemId,
                    ProductId = oi.ProductId,
                    ProductName = oi.Product != null ? oi.Product.Name : null,
                    Sku = oi.Product != null ? oi.Product.Sku : null,
                    Quantity = oi.Quantity,
                    UnitPrice = oi.UnitPrice,
                    LineTotal = (oi.LineTotal ?? (oi.UnitPrice * oi.Quantity))
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

        return order is null ? NotFound() : Ok(order);
    }
    // Cho phép chuyển: Pending -> (Paid|Cancelled|Packing)
    // Packing -> (Shipped|Cancelled)
    // Paid -> (Packing|Cancelled)
    // Shipped -> Delivered
    private static readonly Dictionary<string, string[]> AllowedTransitions = new(StringComparer.OrdinalIgnoreCase)
    {
        ["Pending"] = new[] { "Paid", "Cancelled", "Packing" },
        ["Paid"] = new[] { "Packing", "Cancelled" },
        ["Packing"] = new[] { "Shipped", "Cancelled" },
        ["Shipped"] = new[] { "Delivered" },
        ["Delivered"] = Array.Empty<string>(),
        ["Cancelled"] = Array.Empty<string>()
    };

    // PATCH /api/orders/{id}/status
    [HttpPatch("{id:int}/status")]
    public async Task<IActionResult> UpdateStatus(int id, [FromBody] UpdateOrderStatusRequest req, CancellationToken ct = default)
    {
        if (req == null || string.IsNullOrWhiteSpace(req.NextStatus))
            return BadRequest("Thiếu trạng thái mới.");

        var order = await _db.Orders
            .Include(o => o.OrderItems)
            .FirstOrDefaultAsync(o => o.OrderId == id, ct);

        if (order == null) return NotFound();

        var current = order.Status ?? "Pending";
        var next = req.NextStatus.Trim();

        if (!AllowedTransitions.TryGetValue(current, out var allowed) || !allowed.Contains(next, StringComparer.OrdinalIgnoreCase))
            return BadRequest($"Không thể chuyển trạng thái từ '{current}' sang '{next}'.");

        // Nếu chuyển sang Cancelled từ trạng thái cho phép -> trả tồn
        if (next.Equals("Cancelled", StringComparison.OrdinalIgnoreCase))
        {
            var pids = order.OrderItems.Select(i => i.ProductId).Distinct().ToList();
            var invRows = await _db.Inventories.Where(i => pids.Contains(i.ProductId)).ToListAsync(ct);
            var invMap = invRows.ToDictionary(i => i.ProductId, i => i);
            foreach (var oi in order.OrderItems)
            {
                if (invMap.TryGetValue(oi.ProductId, out var inv))
                    inv.Quantity = (int?)inv.Quantity is int q ? q + oi.Quantity : oi.Quantity;
            }
        }

        order.Status = next;
        await _db.SaveChangesAsync(ct);
        return Ok(new { message = "Đã cập nhật trạng thái.", orderId = order.OrderId, from = current, to = next });
    }

}
