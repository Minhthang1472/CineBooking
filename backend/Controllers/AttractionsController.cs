using HotelManagementApi.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace HotelManagementApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class AttractionsController : ControllerBase
    {
        private readonly HotelDbContext _context;
        private readonly IWebHostEnvironment _env;

        public AttractionsController(HotelDbContext context, IWebHostEnvironment env)
        {
            _context = context;
            _env = env;
        }

        // GET: api/Attractions -- public, khong can dang nhap
        [HttpGet]
        [AllowAnonymous]
        public async Task<ActionResult<IEnumerable<Attraction>>> GetAttractions()
        {
            return await _context.Attractions.ToListAsync();
        }

        // POST: api/Attractions
        [HttpPost]
        public async Task<ActionResult<Attraction>> CreateAttraction(Attraction attraction)
        {
            _context.Attractions.Add(attraction);
            await _context.SaveChangesAsync();
            return Ok(new { Message = "Them dia diem thanh cong", Data = attraction });
        }

        // PUT: api/Attractions/{id}
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateAttraction(int id, Attraction attraction)
        {
            if (id != attraction.Id) return BadRequest(new { Message = "ID khong khop." });

            _context.Entry(attraction).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!AttractionExists(id)) return NotFound();
                else throw;
            }

            return Ok(new { Message = "Cap nhat dia diem thanh cong" });
        }

        // DELETE: api/Attractions/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteAttraction(int id)
        {
            var attraction = await _context.Attractions.FindAsync(id);
            if (attraction == null) return NotFound();

            _context.Attractions.Remove(attraction);
            await _context.SaveChangesAsync();

            return Ok(new { Message = "Da xoa dia diem." });
        }

        // PATCH: api/Attractions/{id}/image -- Nhan Cloudinary URL tu frontend va luu vao DB
        [HttpPatch("{id}/image")]
        public async Task<IActionResult> UpdateImageUrl(int id, [FromBody] UpdateAttractionImageRequest req)
        {
            var attraction = await _context.Attractions.FindAsync(id);
            if (attraction == null) return NotFound(new { Message = "Khong tim thay dia diem." });

            attraction.ImageUrl = req.Url;
            await _context.SaveChangesAsync();

            return Ok(new { Message = "Cap nhat anh thanh cong!", ImageUrl = attraction.ImageUrl });
        }

        private bool AttractionExists(int id)
        {
            return _context.Attractions.Any(e => e.Id == id);
        }
    }

    public class UpdateAttractionImageRequest
    {
        public string Url { get; set; } = string.Empty;
    }
}