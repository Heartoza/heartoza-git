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

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateOrderRequest req, CancellationToken ct)
    {
        if (req?.Items == null || req.Items.Count == 0)
            return BadRequest("Thiếu danh sách sản phẩm.");
        if (req.Items.Any(i => i.ProductId <= 0 || i.Quantity <= 0))
            return BadRequest("Mỗi item phải có ProductId hợp lệ và Quantity > 0.");
        if (req.ShippingFee < 0)
            return BadRequest("ShippingFee không được âm.");

        // 1) Lấy CategoryId của "Hộp quà"
        var giftBoxCatId = await _db.Categories
            .AsNoTracking()
            .Where(c => c.Name == "Hộp quà")
            .Select(c => c.CategoryId)
            .FirstOrDefaultAsync(ct);
        if (giftBoxCatId == 0)
            return BadRequest("Thiếu danh mục 'Hộp quà'.");

        // 2) Gom items
        var itemGroups = req.Items
            .GroupBy(i => i.ProductId)
            .Select(g => new { ProductId = g.Key, Quantity = g.Sum(x => x.Quantity) })
            .ToList();

        var pids = itemGroups.Select(x => x.ProductId).ToList();

        // 3) Lấy products (IsActive == true), map Price nullable về 0m nếu cần
        var products = await _db.Products
            .AsNoTracking()
            .Where(p => p.IsActive == true && pids.Contains(p.ProductId))
            .Select(p => new
            {
                p.ProductId,
                p.CategoryId,
                Price = (decimal?)p.Price // nếu scaffold ra decimal? thì giữ nguyên
            })
            .ToListAsync(ct);

        if (products.Count != pids.Count)
            return BadRequest("Có sản phẩm không tồn tại hoặc không hoạt động.");

        // 4) Rule hộp quà
        if (!products.Any(p => p.CategoryId == giftBoxCatId))
            return BadRequest("Đơn hàng phải có ít nhất 1 sản phẩm thuộc danh mục 'Hộp quà'.");

        // 5) Kiểm tra tồn kho
        var invRows = await _db.Inventories
            .Where(i => pids.Contains(i.ProductId))
            .ToListAsync(ct);
        var invMap = invRows.ToDictionary(i => i.ProductId, i => i);

        foreach (var g in itemGroups)
        {
            if (!invMap.TryGetValue(g.ProductId, out var invRow))
                return BadRequest($"Sản phẩm {g.ProductId} chưa có dòng tồn kho.");

            // Quantity là int (DB NOT NULL). Nếu scaffold thành int?, dùng GetValueOrDefault
            var onHand = (int?)invRow.Quantity;
            if (onHand.GetValueOrDefault() < g.Quantity)
                return BadRequest($"Sản phẩm {g.ProductId} không đủ hàng (tồn: {onHand.GetValueOrDefault()}, cần: {g.Quantity}).");
        }

        // 6) Tính tiền (Price có thể nullable -> GetValueOrDefault)
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
                // Nếu Quantity là int?:
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
                Carrier = null,       // nullable trong DB
                TrackingCode = null,  // nullable trong DB
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

    // === GET: project sang DTO để tránh cycle + null-safe ===
    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id, CancellationToken ct)
    {
        var order = await _db.Orders
            .AsNoTracking()
            .Where(o => o.OrderId == id)
            .Select(o => new OrderResponse
            {
                OrderId = o.OrderId,
                OrderCode = o.OrderCode ?? string.Empty,      // tránh CS8601
                UserId = o.UserId,
                ShippingAddressId = o.ShippingAddressId,
                Subtotal = o.Subtotal,                        // decimal (NOT NULL)
                ShippingFee = o.ShippingFee.GetValueOrDefault(0m),  // <— FIX nullable
                GrandTotal = o.GrandTotal,                    // decimal (NOT NULL)
                Status = o.Status ?? "Pending",
                CreatedAt = o.CreatedAt,                      // DateTime? OK
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
                    Carrier = s.Carrier,               // nullable
                    TrackingCode = s.TrackingCode,     // nullable
                    Status = s.Status ?? "Packing",
                    CreatedAt = s.CreatedAt
                }).ToList()
            })
            .FirstOrDefaultAsync(ct);

        if (order == null) return NotFound();
        return Ok(order);
    }
}
