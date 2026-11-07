using HotelManagementApi.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace HotelManagementApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ServiceCategoriesController : ControllerBase
    {
        private readonly HotelDbContext _context;

        public ServiceCategoriesController(HotelDbContext context)
        {
            _context = context;
        }

        // GET: api/ServiceCategories
        [HttpGet]
        public async Task<IActionResult> GetServiceCategories()
        {
            var categories = await _context.ServiceCategories.ToListAsync();
            return Ok(new { data = categories });
        }

        // GET: api/ServiceCategories/5
        [HttpGet("{id}")]
        public async Task<IActionResult> GetServiceCategory(int id)
        {
            var category = await _context.ServiceCategories.FindAsync(id);

            if (category == null)
            {
                return NotFound(new { message = "Không tìm thấy danh mục" });
            }

            return Ok(new { data = category });
        }

        // POST: api/ServiceCategories
        [HttpPost]
        public async Task<IActionResult> CreateServiceCategory([FromBody] ServiceCategory category)
        {
            _context.ServiceCategories.Add(category);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Đã thêm danh mục dịch vụ mới", data = category });
        }

        // PUT: api/ServiceCategories/5
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateServiceCategory(int id, [FromBody] ServiceCategory categoryInfo)
        {
            if (id != categoryInfo.Id)
            {
                return BadRequest(new { message = "Id không hợp lệ" });
            }

            var category = await _context.ServiceCategories.FindAsync(id);
            if (category == null)
            {
                return NotFound(new { message = "Không tìm thấy danh mục" });
            }

            category.Name = categoryInfo.Name;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!ServiceCategoryExists(id))
                {
                    return NotFound();
                }
                else
                {
                    throw;
                }
            }

            return Ok(new { message = "Cập nhật thành công", data = category });
        }

        // DELETE: api/ServiceCategories/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteServiceCategory(int id)
        {
            var category = await _context.ServiceCategories.FindAsync(id);
            if (category == null)
            {
                return NotFound(new { message = "Không tìm thấy danh mục" });
            }

            // Check if there are services in this category before deleting
            bool hasServices = await _context.Services.AnyAsync(s => s.CategoryId == id);
            if (hasServices)
            {
                return BadRequest(new { message = "Danh mục đang chứa dịch vụ, không thể xóa" });
            }

            _context.ServiceCategories.Remove(category);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Xóa thành công" });
        }

        private bool ServiceCategoryExists(int id)
        {
            return _context.ServiceCategories.Any(e => e.Id == id);
        }
    }
}
