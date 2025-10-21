using Heartoza.DTO.Cart;
using Heartoza.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace Heartoza.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize] // 👉 bắt buộc phải login mới gọi được API
    public class CartController : ControllerBase
    {
        private readonly GiftBoxShopContext _context;

        public CartController(GiftBoxShopContext context)
        {
            _context = context;
        }

        // Hàm lấy UserId từ token JWT
        private int? GetUserIdOrNull()
        {
            var id = User.FindFirstValue(ClaimTypes.NameIdentifier)
                  ?? User.FindFirstValue(ClaimTypes.Name)
                  ?? User.FindFirstValue("sub");
            return int.TryParse(id, out var uid) ? uid : null;
        }

        [HttpGet]
        public async Task<IActionResult> GetCart()
        {
            var userId = GetUserIdOrNull();
            if (userId == null)
                return Unauthorized("Bạn cần đăng nhập trước.");

            var cart = await _context.Carts
                .Include(c => c.CartItems)
                    .ThenInclude(ci => ci.Product)
                .FirstOrDefaultAsync(c => c.UserId == userId.Value);

            if (cart == null)
            {
                return Ok(new { cartItems = new object[0] });
            }

            var productIds = cart.CartItems.Select(ci => ci.ProductId).Distinct().ToList();

            var inventoryMap = await _context.Inventories
                .Where(inv => productIds.Contains(inv.ProductId))
                .ToDictionaryAsync(inv => inv.ProductId, inv => inv.Quantity);

            var cartDto = new
            {
                cart.CartId,
                cart.UserId,
                cartItems = cart.CartItems.Select(ci => new
                {
                    ci.CartItemId,
                    ProductId = ci.Product.ProductId,
                    ProductName = ci.Product.Name,
                    ci.Quantity,
                    UnitPrice = ci.UnitPrice,
                    LineTotal = ci.Quantity * ci.UnitPrice,
                    AvailableStock = inventoryMap.ContainsKey(ci.ProductId)
                        ? inventoryMap[ci.ProductId]
                        : 0 
                })
            };

            return Ok(cartDto);
        }



        [HttpPost("AddItem")]
        public async Task<IActionResult> AddItem([FromBody] AddToCartDto dto)
        {
            var userId = GetUserIdOrNull();
            if (userId == null)
                return Unauthorized("Bạn cần đăng nhập trước.");

            if (dto == null)
                return BadRequest("Dữ liệu gửi lên không hợp lệ.");

            if (dto.Quantity <= 0)
                return BadRequest("Số lượng phải lớn hơn 0.");

            // Tìm giỏ hàng của user
            var cart = await _context.Carts
                .Include(c => c.CartItems)
                .FirstOrDefaultAsync(c => c.UserId == userId);

            if (cart == null)
            {
                cart = new Cart
                {
                    UserId = userId.Value,
                    CreatedAt = DateTime.Now,
                    CartItems = new List<CartItem>()
                };

                _context.Carts.Add(cart);
                await _context.SaveChangesAsync();
            }

            // Kiểm tra sản phẩm có tồn tại không
            var product = await _context.Products.FindAsync(dto.ProductId);
            if (product == null)
                return NotFound("Sản phẩm không tồn tại.");

            // Kiểm tra sản phẩm đã có trong giỏ chưa
            var cartItem = cart.CartItems
                .FirstOrDefault(ci => ci.ProductId == dto.ProductId);

            if (cartItem != null)
            {
                cartItem.Quantity += dto.Quantity;
            }
            else
            {
                cartItem = new CartItem
                {
                    CartId = cart.CartId,
                    ProductId = dto.ProductId,
                    Quantity = dto.Quantity,
                    UnitPrice = product.Price
                };
                _context.CartItems.Add(cartItem);
            }

            await _context.SaveChangesAsync();

            return Ok(new { message = "Đã thêm vào giỏ hàng thành công" });
        }

        [HttpPost("UpdateQuantity")]
        public async Task<IActionResult> UpdateQuantity([FromBody] UpdateCartItemDto dto)
        {
            var userId = GetUserIdOrNull();
            if (userId == null)
                return Unauthorized("Bạn cần đăng nhập trước.");

            var cart = await _context.Carts
                .Include(c => c.CartItems)
                .FirstOrDefaultAsync(c => c.UserId == userId.Value);

            if (cart == null)
                return NotFound("Giỏ hàng trống.");

            var cartItem = cart.CartItems.FirstOrDefault(ci => ci.CartItemId == dto.CartItemId);
            if (cartItem == null)
                return NotFound("Sản phẩm không có trong giỏ.");

            if (dto.Quantity <= 0)
            {
                // Xóa item nếu quantity <= 0
                _context.CartItems.Remove(cartItem);
            }
            else
            {
                cartItem.Quantity = dto.Quantity;
            }

            await _context.SaveChangesAsync();
            return Ok(new { message = "Cập nhật thành công" });
        }
        [HttpDelete("RemoveItem/{cartItemId}")]
        public async Task<IActionResult> RemoveItem(int cartItemId)
        {
            var userId = GetUserIdOrNull();
            if (userId == null) return Unauthorized();

            var cartItem = await _context.CartItems
                .Include(ci => ci.Cart)
                .FirstOrDefaultAsync(ci => ci.CartItemId == cartItemId && ci.Cart.UserId == userId);

            if (cartItem == null) return NotFound("Item không tồn tại trong giỏ hàng.");

            _context.CartItems.Remove(cartItem);
            await _context.SaveChangesAsync();
            return Ok(new { message = "Xóa item thành công" });
        }

    }
}
