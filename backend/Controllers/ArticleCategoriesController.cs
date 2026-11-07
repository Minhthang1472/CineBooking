// Tác giả: Võ Trần Minh Thắng - MSSV: 123001472
using HotelManagementApi.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace HotelManagementApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize] // Bắt buộc đăng nhập
    public class ArticleCategoriesController : ControllerBase
    {
        private readonly HotelDbContext _context;

        public ArticleCategoriesController(HotelDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<ArticleCategory>>> GetArticleCategories()
        {
            return await _context.ArticleCategories.ToListAsync();
        }

        [HttpPost]
        public async Task<ActionResult<ArticleCategory>> CreateCategory(ArticleCategory category)
        {
            _context.ArticleCategories.Add(category);
            await _context.SaveChangesAsync();
            return Ok(new { Message = "Thêm danh mục thành công", Data = category });
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateCategory(int id, ArticleCategory category)
        {
            if (id != category.Id) return BadRequest("ID không khớp");

            _context.Entry(category).State = EntityState.Modified;
            await _context.SaveChangesAsync();
            return Ok(new { Message = "Cập nhật thành công" });
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteCategory(int id)
        {
            var category = await _context.ArticleCategories.FindAsync(id);
            if (category == null) return NotFound();

            _context.ArticleCategories.Remove(category);
            await _context.SaveChangesAsync();
            return Ok(new { Message = "Đã xóa danh mục" });
        }
    }
}