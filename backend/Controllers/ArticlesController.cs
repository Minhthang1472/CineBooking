using HotelManagementApi.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace HotelManagementApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class ArticlesController : ControllerBase
    {
        private readonly HotelDbContext _context;
        private readonly IWebHostEnvironment _env;

        public ArticlesController(HotelDbContext context, IWebHostEnvironment env)
        {
            _context = context;
            _env = env;
        }

        // GET: api/Articles — public, không cần đăng nhập
        [HttpGet]
        [AllowAnonymous]
        public async Task<ActionResult<IEnumerable<Article>>> GetArticles()
        {
            return await _context.Articles
                .Include(a => a.Category)
                .Include(a => a.Author)
                .ToListAsync();
        }

        // GET: api/Articles/{slug} — public
        [HttpGet("{slug}")]
        [AllowAnonymous]
        public async Task<ActionResult<Article>> GetArticleBySlug(string slug)
        {
            var article = await _context.Articles
                .Include(a => a.Category)
                .Include(a => a.Author)
                .FirstOrDefaultAsync(a => a.Slug == slug);

            if (article == null) return NotFound(new { Message = "Không tìm thấy bài viết" });

            return Ok(article);
        }

        // POST: api/Articles
        [HttpPost]
        public async Task<ActionResult<Article>> CreateArticle(Article article)
        {
            // Tự động gán người viết bài là người đang đăng nhập
            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (int.TryParse(userIdStr, out int authorId))
            {
                article.AuthorId = authorId;
            }

            article.PublishedAt = DateTime.Now;

            _context.Articles.Add(article);
            await _context.SaveChangesAsync();

            return Ok(new { Message = "Đăng bài thành công!", Data = article });
        }

        // PUT: api/Articles/{id}
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateArticle(int id, Article article)
        {
            if (id != article.Id) return BadRequest("ID không khớp");

            _context.Entry(article).State = EntityState.Modified;
            await _context.SaveChangesAsync();
            return Ok(new { Message = "Cập nhật bài viết thành công" });
        }

        // DELETE: api/Articles/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteArticle(int id)
        {
            var article = await _context.Articles.FindAsync(id);
            if (article == null) return NotFound();

            _context.Articles.Remove(article);
            await _context.SaveChangesAsync();
            return Ok(new { Message = "Đã xóa bài viết" });
        }

        // PATCH: api/Articles/{id}/thumbnail — Nhan Cloudinary URL va luu vao DB
        [HttpPatch("{id}/thumbnail")]
        public async Task<IActionResult> UpdateThumbnailUrl(int id, [FromBody] UpdateImageUrlRequest req)
        {
            var article = await _context.Articles.FindAsync(id);
            if (article == null) return NotFound(new { Message = "Khong tim thay bai viet." });

            article.ThumbnailUrl = req.Url;
            await _context.SaveChangesAsync();

            return Ok(new { Message = "Cap nhat anh bia thanh cong!", ThumbnailUrl = article.ThumbnailUrl });
        }
    }

    public class UpdateImageUrlRequest
    {
        public string Url { get; set; } = string.Empty;
    }
}