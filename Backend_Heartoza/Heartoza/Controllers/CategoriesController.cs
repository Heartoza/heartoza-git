
// CategoriesController
using Heartoza.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

[ApiController]
[Route("api/[controller]")]
public class CategoriesController : ControllerBase
{
    private readonly GiftBoxShopContext _db;
    public CategoriesController(GiftBoxShopContext db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> Get() =>
        Ok(await _db.Categories.OrderBy(c => c.Name).ToListAsync());
}
