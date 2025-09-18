using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using System.Collections.Generic;
using Heartoza.DTO.Categories;
using Heartoza.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

[ApiController]
[Route("api/[controller]")]
public class CategoriesController : ControllerBase
{
    private readonly GiftBoxShopContext _db;
    public CategoriesController(GiftBoxShopContext db) => _db = db;

    /// <summary>
    /// GET /api/categories?tree=false&includeCounts=false
    /// - tree=false: trả list phẳng (sorted by Name)
    /// - tree=true : trả dạng cây (children)
    /// - includeCounts=true: kèm số lượng sản phẩm trực tiếp trong từng category
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> Get(
        [FromQuery] bool tree = false,
        [FromQuery] bool includeCounts = false,
        CancellationToken ct = default)
    {
        if (!tree)
        {
            // List phẳng
            var query = _db.Categories.AsNoTracking().OrderBy(c => c.Name);
            if (!includeCounts)
            {
                var items = await query
                    .Select(c => new CategoryItemDto
                    {
                        CategoryId = c.CategoryId,
                        Name = c.Name,
                        ParentId = c.ParentId
                    }).ToListAsync(ct);

                return Ok(items);
            }
            else
            {
                // Đếm số sản phẩm trực tiếp trong category
                var items = await query
                    .Select(c => new CategoryItemDto
                    {
                        CategoryId = c.CategoryId,
                        Name = c.Name,
                        ParentId = c.ParentId,
                        ProductCount = _db.Products.Count(p => p.CategoryId == c.CategoryId)
                    }).ToListAsync(ct);

                return Ok(items);
            }
        }
        else
        {
            // Dạng cây
            var cats = await _db.Categories
                .AsNoTracking()
                .Select(c => new { c.CategoryId, c.Name, c.ParentId })
                .ToListAsync(ct);

            Dictionary<int, int> countMap = new();
            if (includeCounts)
            {
                countMap = await _db.Products
                    .AsNoTracking()
                    .GroupBy(p => p.CategoryId)
                    .Select(g => new { g.Key, Cnt = g.Count() })
                    .ToDictionaryAsync(x => x.Key, x => x.Cnt, ct);
            }

            var nodes = cats.ToDictionary(
                c => c.CategoryId,
                c => new CategoryTreeDto
                {
                    CategoryId = c.CategoryId,
                    Name = c.Name,
                    ParentId = c.ParentId,
                    ProductCount = includeCounts && countMap.TryGetValue(c.CategoryId, out var cnt) ? cnt : 0,
                    Children = new List<CategoryTreeDto>()
                });

            List<CategoryTreeDto> roots = new();
            foreach (var c in cats)
            {
                if (c.ParentId is null)
                {
                    roots.Add(nodes[c.CategoryId]);
                }
                else if (nodes.TryGetValue(c.ParentId.Value, out var parent))
                {
                    parent.Children.Add(nodes[c.CategoryId]);
                }
                else
                {
                    // ParentId không tồn tại -> coi như root (tránh rơi node)
                    roots.Add(nodes[c.CategoryId]);
                }
            }

            // sort children by Name cho đẹp
            void SortTree(List<CategoryTreeDto> list)
            {
                list.Sort((a, b) => string.Compare(a.Name, b.Name, StringComparison.Ordinal));
                foreach (var n in list) SortTree(n.Children);
            }
            SortTree(roots);

            return Ok(roots);
        }
    }

    /// <summary>
    /// GET /api/categories/{id}
    /// </summary>
    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id, CancellationToken ct = default)
    {
        var c = await _db.Categories
            .AsNoTracking()
            .Where(x => x.CategoryId == id)
            .Select(x => new CategoryItemDto
            {
                CategoryId = x.CategoryId,
                Name = x.Name,
                ParentId = x.ParentId,
                ProductCount = _db.Products.Count(p => p.CategoryId == x.CategoryId)
            })
            .FirstOrDefaultAsync(ct);

        return c is null ? NotFound() : Ok(c);
    }

    /// <summary>
    /// POST /api/categories
    /// </summary>
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CategoryCreateDto req, CancellationToken ct = default)
    {
        if (req is null || string.IsNullOrWhiteSpace(req.Name))
            return BadRequest("Tên danh mục không được để trống.");

        // Validate ParentId (nếu có)
        if (req.ParentId.HasValue)
        {
            var exists = await _db.Categories.AnyAsync(c => c.CategoryId == req.ParentId.Value, ct);
            if (!exists) return BadRequest("ParentId không tồn tại.");
        }

        var cat = new Category
        {
            Name = req.Name.Trim(),
            ParentId = req.ParentId
        };

        _db.Categories.Add(cat);
        await _db.SaveChangesAsync(ct);

        return CreatedAtAction(nameof(GetById), new { id = cat.CategoryId }, new { cat.CategoryId, cat.Name, cat.ParentId });
    }

    /// <summary>
    /// PUT /api/categories/{id}
    /// - Không cho set ParentId = chính nó
    /// - Không cho tạo vòng (đặt parent là con/cháu của chính nó)
    /// </summary>
    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] CategoryUpdateDto req, CancellationToken ct = default)
    {
        var cat = await _db.Categories.FirstOrDefaultAsync(c => c.CategoryId == id, ct);
        if (cat is null) return NotFound();

        if (!string.IsNullOrWhiteSpace(req.Name))
            cat.Name = req.Name.Trim();

        if (req.ParentIdHasValue)
        {
            // Phân biệt: client có gửi ParentId hay không
            var newParentId = req.ParentId; // có thể null

            // Không cho set parent = chính nó
            if (newParentId.HasValue && newParentId.Value == id)
                return BadRequest("ParentId không thể là chính danh mục.");

            // Nếu có newParent, check tồn tại
            if (newParentId.HasValue)
            {
                var parentExists = await _db.Categories.AnyAsync(c => c.CategoryId == newParentId.Value, ct);
                if (!parentExists) return BadRequest("ParentId không tồn tại.");

                // Check vòng: newParent không được là hậu duệ của id
                var all = await _db.Categories
                    .AsNoTracking()
                    .Select(c => new CatNode(c.CategoryId, c.ParentId))
                    .ToListAsync(ct);

                var descendants = GetDescendants(id, all);
                if (descendants.Contains(newParentId.Value))
                    return BadRequest("Không thể đặt ParentId thành con/cháu của danh mục hiện tại (gây vòng).");
            }

            cat.ParentId = newParentId; // chấp nhận null (đẩy lên root)
        }

        await _db.SaveChangesAsync(ct);
        return Ok(new { cat.CategoryId, cat.Name, cat.ParentId });
    }

    /// <summary>
    /// DELETE /api/categories/{id}
    /// - Chặn xóa nếu còn category con
    /// - Chặn xóa nếu còn products tham chiếu
    /// </summary>
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id, CancellationToken ct = default)
    {
        var cat = await _db.Categories.FirstOrDefaultAsync(c => c.CategoryId == id, ct);
        if (cat is null) return NotFound();

        var hasChildren = await _db.Categories.AnyAsync(c => c.ParentId == id, ct);
        if (hasChildren) return BadRequest("Không thể xóa vì còn danh mục con.");

        var hasProducts = await _db.Products.AnyAsync(p => p.CategoryId == id, ct);
        if (hasProducts) return BadRequest("Không thể xóa vì còn sản phẩm thuộc danh mục này.");

        _db.Categories.Remove(cat);
        await _db.SaveChangesAsync(ct);
        return Ok(new { message = "Đã xóa danh mục.", id });
    }

    // Helpers
    private static HashSet<int> GetDescendants(int id, List<dynamic> all)
    {
        // all: { CategoryId, ParentId }
        var childrenMap = all
            .GroupBy(x => (int?)(x.ParentId ?? null))
            .ToDictionary(g => g.Key, g => g.Select(v => (int)v.CategoryId).ToList());

        var result = new HashSet<int>();
        var stack = new Stack<int>();
        if (childrenMap.TryGetValue(id, out var directChildren))
        {
            foreach (var c in directChildren) stack.Push(c);
        }

        while (stack.Count > 0)
        {
            var cur = stack.Pop();
            if (!result.Add(cur)) continue;
            if (childrenMap.TryGetValue(cur, out var more))
            {
                foreach (var m in more) stack.Push(m);
            }
        }

        return result;
    }

    // Helpers
    private record CatNode(int CategoryId, int? ParentId);

    private static HashSet<int> GetDescendants(int id, List<CatNode> all)
    {
        var childrenMap = all
            .GroupBy(x => x.ParentId)
            .ToDictionary(g => g.Key, g => g.Select(v => v.CategoryId).ToList());

        var result = new HashSet<int>();
        var stack = new Stack<int>();
        if (childrenMap.TryGetValue(id, out var directChildren))
        {
            foreach (var c in directChildren) stack.Push(c);
        }

        while (stack.Count > 0)
        {
            var cur = stack.Pop();
            if (!result.Add(cur)) continue;
            if (childrenMap.TryGetValue(cur, out var more))
            {
                foreach (var m in more) stack.Push(m);
            }
        }

        return result;
    }

}
